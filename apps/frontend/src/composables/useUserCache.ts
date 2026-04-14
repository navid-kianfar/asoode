import { reactive } from 'vue';
import { type MemberInfoViewModel, type OperationResult, OperationResultStatus, API } from '@asoode/shared';
import { httpService } from '@/services/http.service';
import { useGroupStore } from '@/stores/group.store';
import { useProjectStore } from '@/stores/project.store';
import { useAuthStore } from '@/stores/auth.store';

const cache = reactive<Record<string, MemberInfoViewModel>>({});
const pending = new Set<string>();

function populateFromStores(): void {
  const authStore = useAuthStore();
  const groupStore = useGroupStore();
  const projectStore = useProjectStore();

  // Current user
  if (authStore.profile && authStore.userId) {
    cache[authStore.userId] = {
      id: authStore.userId,
      fullName: authStore.profile.fullName || '',
      firstName: authStore.profile.firstName || '',
      lastName: authStore.profile.lastName || '',
      initials: authStore.profile.initials || '',
      email: authStore.profile.email || '',
      avatar: authStore.profile.avatar || '',
      username: authStore.profile.username || '',
      bio: authStore.profile.bio || '',
    };
  }

  // Group members
  for (const group of groupStore.groups) {
    if (!group.members) continue;
    for (const m of group.members) {
      if (m.member && m.userId && !cache[m.userId]) {
        cache[m.userId] = m.member;
      }
    }
  }

  // Project members
  for (const project of projectStore.projects) {
    if (!(project as any).members) continue;
    for (const m of (project as any).members) {
      if (m.member && m.recordId && !cache[m.recordId]) {
        cache[m.recordId] = m.member;
      }
    }
  }
}

async function fetchUser(userId: string): Promise<void> {
  if (cache[userId] || pending.has(userId)) return;
  pending.add(userId);
  try {
    const result: OperationResult<MemberInfoViewModel> = await httpService.post<MemberInfoViewModel>(
      API.ACCOUNT_MEMBER_PROFILE(userId),
    );
    if (result.status === OperationResultStatus.Success && result.data) {
      cache[userId] = result.data;
    }
  } catch {
    // Silently fail - user will see fallback
  } finally {
    pending.delete(userId);
  }
}

export function useUserCache() {
  function resolveUser(userId: string): MemberInfoViewModel | undefined {
    if (!userId) return undefined;
    const cached = cache[userId];
    if (cached) return cached;
    // Trigger population from stores in case new data loaded
    populateFromStores();
    if (cache[userId]) return cache[userId];
    // Trigger async fetch
    fetchUser(userId);
    return undefined;
  }

  function resolveUserName(userId: string): string {
    const user = resolveUser(userId);
    return user?.fullName || '';
  }

  function resolveUserInitials(userId: string): string {
    const user = resolveUser(userId);
    if (user?.initials) return user.initials;
    if (user?.fullName) {
      const parts = user.fullName.trim().split(/\s+/);
      return parts.map((p) => p.charAt(0)).join('').toUpperCase().slice(0, 2);
    }
    return '?';
  }

  function seed(userId: string, info: MemberInfoViewModel): void {
    cache[userId] = info;
  }

  return {
    cache,
    resolveUser,
    resolveUserName,
    resolveUserInitials,
    seed,
    populateFromStores,
  };
}

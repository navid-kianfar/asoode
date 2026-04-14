<template>
  <div class="dp">
    <DashboardSkeleton v-if="loading" />
    <template v-else>
    <!-- ═══════════ HEADER ═══════════ -->
    <div class="dp-header">
      <div class="dp-header__left">
        <h1 class="dp-header__greeting">{{ greeting }}{{ userName ? ', ' + userName : '' }}</h1>
        <span class="dp-header__date">{{ formattedDate }}</span>
      </div>
      <div v-if="isAdmin" class="dp-mode-switch">
        <button
          :class="['dp-mode-switch__btn', { active: mode === 'work' }]"
          @click="mode = 'work'"
        >
          <i class="mdi mdi-account-outline"></i>
          My Work
        </button>
        <button
          :class="['dp-mode-switch__btn', { active: mode === 'manager' }]"
          @click="mode = 'manager'"
        >
          <i class="mdi mdi-chart-timeline-variant-shimmer"></i>
          Manager
        </button>
        <span class="dp-mode-switch__pill" :class="{ right: mode === 'manager' }"></span>
      </div>
    </div>

    <!-- ═══════════ MODE CONTENT ═══════════ -->
    <Transition name="dp-fade" mode="out-in">
      <!-- ─── MY WORK MODE ─── -->
      <div v-if="mode === 'work'" key="work" class="dp-body">
        <!-- Today's Focus -->
        <section class="dp-section">
          <div class="dp-section__head">
            <span class="dp-section__title">Today's Focus</span>
            <span class="dp-section__badge">{{ todayDoneCount }}/{{ todayTasks.length }} done</span>
          </div>
          <div class="dp-focus-grid">
            <div
              v-for="task in todayTasks"
              :key="task.id"
              :class="['dp-focus-card', 'dp-focus-card--' + task.status]"
              @click="openedTaskId = task.taskId"
            >
              <i :class="statusIcon(task.status)"></i>
              <div class="dp-focus-card__body">
                <span class="dp-focus-card__title">{{ task.title }}</span>
                <span class="dp-focus-card__project">{{ task.project }}</span>
                <span class="dp-focus-card__time">{{ task.time }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Stats + Heatmap Row -->
        <div class="dp-stats-row">
          <!-- My Stats -->
          <div class="dp-card dp-card--hero dp-stats-card">
            <div class="dp-stats-card__header">
              <span class="dp-card__title">My Stats</span>
              <span v-if="streak > 0" class="dp-stats-card__streak">
                <i class="mdi mdi-fire"></i> {{ streak }}-day streak
              </span>
            </div>
            <div class="dp-stats-card__metrics">
              <div v-for="stat in myStats" :key="stat.label" class="dp-stat">
                <span class="dp-stat__value">{{ stat.value }}</span>
                <span class="dp-stat__label">{{ stat.label }}</span>
                <div class="dp-stat__sparkline">
                  <Line :data="stat.sparkData" :options="sparklineOptions" />
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Heatmap -->
          <div class="dp-card dp-heatmap-card">
            <span class="dp-card__title">Activity Heatmap</span>
            <div class="dp-heatmap-wrap">
              <svg
                class="dp-heatmap"
                :viewBox="`0 0 ${heatmapCols * 14 + 28} ${5 * 14}`"
                preserveAspectRatio="xMinYMin meet"
              >
                <text
                  v-for="(label, i) in ['Mon', 'Wed', 'Fri']"
                  :key="label"
                  :x="0"
                  :y="i * 28 + 10"
                  class="dp-heatmap__label"
                >{{ label }}</text>
                <g
                  v-for="(week, wi) in heatmapData"
                  :key="wi"
                  :transform="`translate(${wi * 14 + 28}, 0)`"
                >
                  <rect
                    v-for="(day, di) in week"
                    :key="di"
                    :y="di * 14"
                    width="10"
                    height="10"
                    rx="2"
                    :fill="heatmapColor(day)"
                  />
                </g>
              </svg>
            </div>
            <div class="dp-heatmap__legend">
              <span>Less</span>
              <span
                v-for="l in 5"
                :key="l"
                class="dp-heatmap__swatch"
                :style="{ background: heatmapColor(l - 1) }"
              ></span>
              <span>More</span>
            </div>
          </div>
        </div>

        <!-- Schedule + Activity Row -->
        <div class="dp-grid-2col">
          <!-- My Schedule -->
          <div class="dp-card">
            <span class="dp-card__title">My Schedule</span>
            <div class="dp-schedule">
              <div v-for="group in scheduleGroups" :key="group.label" class="dp-schedule__group">
                <span class="dp-schedule__group-label">
                  <i :class="group.icon"></i> {{ group.label }}
                </span>
                <div
                  v-for="item in group.items"
                  :key="item.title"
                  :class="['dp-schedule__item', { 'dp-schedule__item--clickable': item.taskId }]"
                  @click="item.taskId && (openedTaskId = item.taskId)"
                >
                  <span class="dp-schedule__dot" :style="{ background: item.color }"></span>
                  <span class="dp-schedule__name">{{ item.title }}</span>
                  <span class="dp-schedule__project">{{ item.project }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- My Activity -->
          <div class="dp-card">
            <span class="dp-card__title">My Activity</span>
            <div class="dp-activity-list">
              <div
                v-for="(a, i) in myActivities"
                :key="i"
                :class="['dp-activity-item', { 'dp-activity-item--clickable': a.taskId }]"
                @click="a.taskId && (openedTaskId = a.taskId)"
              >
                <span class="dp-activity-item__dot" :style="{ background: a.color }"></span>
                <div class="dp-activity-item__body">
                  <span class="dp-activity-item__text">
                    {{ a.action }} "<strong>{{ a.task }}</strong>"
                  </span>
                  <span class="dp-activity-item__time">{{ a.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ─── MANAGER MODE ─── -->
      <div v-else key="manager" class="dp-body">
        <!-- Metric Cards -->
        <div class="dp-metrics-grid">
          <div
            v-for="m in managerMetrics"
            :key="m.label"
            class="dp-card dp-metric-card"
            :style="{ borderLeftColor: m.accent }"
          >
            <div class="dp-metric-card__top">
              <span class="dp-metric-card__value">{{ m.value }}</span>
              <span :class="['dp-metric-card__trend', m.trendUp ? 'up' : 'down']">
                <i :class="m.trendUp ? 'mdi mdi-arrow-up' : 'mdi mdi-arrow-down'"></i>
                {{ m.trend }}
              </span>
            </div>
            <span class="dp-metric-card__label">{{ m.label }}</span>
            <div v-if="m.type === 'sparkline'" class="dp-metric-card__spark">
              <Line :data="m.sparkData!" :options="sparklineOptions" />
            </div>
            <div v-else class="dp-metric-card__ring">
              <svg viewBox="0 0 36 36">
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  stroke-width="2.5"
                />
                <circle
                  cx="18" cy="18" r="15.9"
                  fill="none"
                  :stroke="m.accent"
                  stroke-width="2.5"
                  stroke-linecap="round"
                  stroke-dasharray="100"
                  :stroke-dashoffset="100 - Number(m.value)"
                  class="dp-ring-path"
                />
                <text x="18" y="20" text-anchor="middle" class="dp-ring-text">
                  {{ m.value }}%
                </text>
              </svg>
            </div>
          </div>
        </div>

        <!-- Team Velocity Chart -->
        <div class="dp-card dp-velocity-card">
          <div class="dp-card__head">
            <span class="dp-card__title dp-card__title--inline">Team Velocity</span>
            <div class="dp-card__head-right">
              <span class="dp-chart-legend">
                <i style="background: #74d68c"></i> Completed
              </span>
              <span class="dp-chart-legend">
                <i style="background: #59a8ef"></i> Created
              </span>
              <span class="dp-chart-legend">
                <i style="background: #ee6285"></i> Blocked
              </span>
              <div class="dp-period">
                <button
                  v-for="p in periods"
                  :key="p"
                  :class="['dp-period__btn', { active: selectedPeriod === p }]"
                  @click="selectedPeriod = p"
                >{{ p }}D</button>
              </div>
            </div>
          </div>
          <div class="dp-velocity-chart">
            <Line :data="velocityChartData" :options="velocityChartOptions" />
          </div>
        </div>

        <!-- Distribution + Project Health -->
        <div class="dp-grid-2col">
          <!-- Task Distribution -->
          <div class="dp-card dp-distribution">
            <span class="dp-card__title">Task Distribution</span>
            <div class="dp-distribution__content">
              <div class="dp-distribution__chart">
                <Doughnut :data="doughnutData" :options="doughnutOptions" />
                <div class="dp-distribution__center">
                  <span class="dp-distribution__total">{{ distributionTotal }}</span>
                  <span class="dp-distribution__total-label">Total</span>
                </div>
              </div>
              <div class="dp-distribution__legend">
                <div v-for="item in distributionItems" :key="item.label" class="dp-distribution__leg-item">
                  <span class="dp-distribution__dot" :style="{ background: item.color }"></span>
                  <span class="dp-distribution__leg-label">{{ item.label }}</span>
                  <span class="dp-distribution__leg-value">{{ item.value }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Project Health -->
          <div class="dp-card">
            <span class="dp-card__title">Project Health</span>
            <div class="dp-health-list">
              <div
                v-for="p in projects"
                :key="p.name"
                class="dp-health-item dp-health-item--clickable"
                @click="onProjectClick(p.id)"
              >
                <div class="dp-health-item__top">
                  <span class="dp-health-item__name">{{ p.name }}</span>
                  <span class="dp-health-item__pct">{{ p.progress }}%</span>
                </div>
                <div class="dp-health-item__bar">
                  <div
                    class="dp-health-item__bar-fill"
                    :style="{ width: p.progress + '%', background: p.color }"
                  ></div>
                </div>
                <div class="dp-health-item__meta">
                  <span>{{ p.tasks }} tasks</span>
                  <div class="dp-avatar-stack">
                    <span
                      v-for="member in p.members"
                      :key="member.initials"
                      class="dp-avatar"
                      :style="{ background: member.color }"
                    >{{ member.initials }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Workload + Risk -->
        <div class="dp-grid-2col">
          <!-- Team Workload -->
          <div class="dp-card">
            <span class="dp-card__title">Team Workload</span>
            <div class="dp-workload-list">
              <div v-for="member in teamMembers" :key="member.name" class="dp-workload-item">
                <div class="dp-workload-item__info">
                  <span class="dp-avatar dp-avatar--sm" :style="{ background: member.color }">
                    {{ member.initials }}
                  </span>
                  <span class="dp-workload-item__name">{{ member.name }}</span>
                  <span class="dp-workload-item__count">{{ member.tasks }} tasks</span>
                </div>
                <div class="dp-workload-item__bar">
                  <div
                    class="dp-workload-item__bar-fill"
                    :style="{
                      width: Math.min((member.tasks / member.capacity) * 100, 100) + '%',
                      background: member.tasks > member.capacity * 0.9 ? '#ee6285' : member.color,
                    }"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk & Attention -->
          <div class="dp-card">
            <span class="dp-card__title">Risk & Attention</span>
            <div class="dp-risk-list">
              <div v-for="(risk, i) in risks" :key="i" class="dp-risk-item">
                <span :class="['dp-risk-dot', 'dp-risk-dot--' + risk.severity]"></span>
                <span class="dp-risk-item__text">{{ risk.text }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Milestones + Team Activity -->
        <div class="dp-grid-2col">
          <!-- Upcoming Milestones -->
          <div class="dp-card">
            <span class="dp-card__title">Upcoming Milestones</span>
            <div class="dp-milestone-list">
              <div v-for="m in milestones" :key="m.title" class="dp-milestone-item">
                <span class="dp-milestone-item__date">{{ m.date }}</span>
                <span class="dp-milestone-item__title">{{ m.title }}</span>
                <span class="dp-milestone-item__badge">{{ m.tasks }} tasks</span>
              </div>
            </div>
          </div>

          <!-- Team Activity -->
          <div class="dp-card">
            <span class="dp-card__title">Team Activity</span>
            <div class="dp-activity-list">
              <div
                v-for="(a, i) in teamActivities"
                :key="i"
                :class="['dp-activity-item', { 'dp-activity-item--clickable': a.taskId }]"
                @click="a.taskId && (openedTaskId = a.taskId)"
              >
                <span class="dp-activity-item__dot" :style="{ background: a.color }"></span>
                <div class="dp-activity-item__body">
                  <span class="dp-activity-item__text">
                    <strong>{{ a.user }}</strong> {{ a.action }} "<strong>{{ a.task }}</strong>"
                  </span>
                  <span class="dp-activity-item__time">{{ a.time }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Task Modal -->
    <TaskModal
      v-if="openedTaskId"
      :taskId="openedTaskId"
      @close="openedTaskId = ''"
      @open-task="openedTaskId = $event"
    />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import TaskModal from '@/components/modals/TaskModal.vue';
import DashboardSkeleton from '@/components/core/skeletons/DashboardSkeleton.vue';
import { useDashboardSocketHandlers } from '@/composables/useDashboardSocketHandlers';
import { useViewContext } from '@/composables/useViewContext';
import { Line, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { httpService } from '@/services/http.service';
import { useAuthStore } from '@/stores/auth.store';
import { useProjectStore } from '@/stores/project.store';
import { useGroupStore } from '@/stores/group.store';
import { useCulturedDate } from '@/composables/useCulturedDate';
import { useUserCache } from '@/composables/useUserCache';
import { useProjectNavigation } from '@/composables/useProjectNavigation';
import {
  API, OperationResultStatus, AccessType, WorkPackageTaskState,
  type DashboardViewModel, type WorkPackageTaskViewModel,
} from '@asoode/shared';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  ArcElement, Filler, Tooltip, Legend,
);

// ═══════════════════════════════════════════
// Stores & Composables
// ═══════════════════════════════════════════
const authStore = useAuthStore();
const projectStore = useProjectStore();
const groupStore = useGroupStore();
const { fromNow } = useCulturedDate();
const { resolveUserName, resolveUserInitials } = useUserCache();
const { navigateToProject } = useProjectNavigation();

// ═══════════════════════════════════════════
// Types
// ═══════════════════════════════════════════
type DashboardMode = 'work' | 'manager';
type TaskStatus = 'done' | 'active' | 'blocked' | 'todo';
type RiskSeverity = 'critical' | 'warning' | 'ok';

interface SparkChartData {
  labels: string[];
  datasets: {
    data: number[];
    borderColor: string;
    backgroundColor: string;
    borderWidth: number;
    tension: number;
    pointRadius: number;
    fill: boolean;
  }[];
}

interface FocusTask {
  id: number;
  taskId: string;
  title: string;
  project: string;
  status: TaskStatus;
  time: string;
}

interface MyStat {
  value: number;
  label: string;
  sparkData: SparkChartData;
}

interface ScheduleItem {
  taskId?: string;
  title: string;
  project: string;
  color: string;
}

interface ScheduleGroup {
  label: string;
  icon: string;
  items: ScheduleItem[];
}

interface ActivityItem {
  taskId?: string;
  user: string;
  action: string;
  task: string;
  time: string;
  color: string;
}

interface ManagerMetric {
  value: number | string;
  label: string;
  trend: string;
  trendUp: boolean;
  accent: string;
  type: 'sparkline' | 'ring';
  sparkData?: SparkChartData;
}

interface ProjectMember {
  initials: string;
  color: string;
}

interface ProjectHealth {
  id: string;
  name: string;
  progress: number;
  tasks: number;
  members: ProjectMember[];
  color: string;
}

interface TeamMember {
  name: string;
  initials: string;
  tasks: number;
  capacity: number;
  color: string;
}

interface RiskItem {
  text: string;
  severity: RiskSeverity;
}

interface Milestone {
  date: string;
  title: string;
  tasks: number;
}

// ═══════════════════════════════════════════
// State
// ═══════════════════════════════════════════
const mode = ref<DashboardMode>('work');
const loading = ref(true);
const selectedPeriod = ref(7);
const periods = [7, 14, 30];
const openedTaskId = ref('');
const dashboardData = ref<DashboardViewModel | null>(null);
const recentTasks = ref<WorkPackageTaskViewModel[]>([]);

useViewContext('dashboard', 'active');
useDashboardSocketHandlers(recentTasks);

// ═══════════════════════════════════════════
// Admin check — show mode switch only for Owner/Admin
// ═══════════════════════════════════════════
const isAdmin = computed(() => {
  return groupStore.groups.some(g => {
    const perm = groupStore.getPermission(g);
    return perm === AccessType.Owner || perm === AccessType.Admin;
  });
});

// ═══════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════
const userName = computed(() => authStore.profile?.firstName || '');

const greeting = computed(() => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
});

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
});

function mapTaskState(state?: WorkPackageTaskState): TaskStatus {
  switch (state) {
    case WorkPackageTaskState.Done: return 'done';
    case WorkPackageTaskState.InProgress: return 'active';
    case WorkPackageTaskState.Blocked:
    case WorkPackageTaskState.Blocker: return 'blocked';
    default: return 'todo';
  }
}

function stateColor(state?: WorkPackageTaskState): string {
  switch (state) {
    case WorkPackageTaskState.Done: return '#74d68c';
    case WorkPackageTaskState.InProgress: return '#59a8ef';
    case WorkPackageTaskState.Blocked:
    case WorkPackageTaskState.Blocker:
    case WorkPackageTaskState.Cancelled: return '#ee6285';
    case WorkPackageTaskState.Paused: return '#ffc107';
    default: return '#b977f7';
  }
}

function statusIcon(status: TaskStatus): string {
  const map: Record<TaskStatus, string> = {
    done: 'mdi mdi-check-circle',
    active: 'mdi mdi-circle-slice-4',
    blocked: 'mdi mdi-close-circle-outline',
    todo: 'mdi mdi-circle-outline',
  };
  return map[status];
}

function makeSparkData(values: number[], color: string): SparkChartData {
  if (!values.length) values = [0];
  return {
    labels: values.map((_, i) => String(i)),
    datasets: [{
      data: values,
      borderColor: color,
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      tension: 0.4,
      pointRadius: 0,
      fill: false,
    }],
  };
}

const sparklineOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false }, tooltip: { enabled: false } },
  scales: {
    x: { display: false },
    y: { display: false },
  },
  animation: { duration: 0 },
};

// Project name lookup
const projectMap = computed(() => {
  const map = new Map<string, string>();
  for (const p of projectStore.projects) {
    map.set(p.id, p.title);
  }
  return map;
});

// Task title lookup (from recent activities)
const taskTitleMap = computed(() => {
  const map = new Map<string, string>();
  for (const t of recentTasks.value) {
    map.set(t.id, t.title);
  }
  return map;
});

// ═══════════════════════════════════════════
// Fetch Data
// ═══════════════════════════════════════════
onMounted(async () => {
  loading.value = true;
  const [dashResult, activitiesResult] = await Promise.all([
    httpService.post<DashboardViewModel>(API.REPORT_DASHBOARD),
    httpService.post<WorkPackageTaskViewModel[]>(API.REPORT_RECENT_ACTIVITIES),
  ]);
  if (dashResult.status === OperationResultStatus.Success) {
    dashboardData.value = dashResult.data;
  }
  if (activitiesResult.status === OperationResultStatus.Success) {
    recentTasks.value = activitiesResult.data || [];
  }
  loading.value = false;
});

function onProjectClick(id: string) {
  const p = projectStore.projects.find((x) => x.id === id);
  if (p) navigateToProject(p);
}

// ═══════════════════════════════════════════
// Heatmap
// ═══════════════════════════════════════════
const heatmapCols = 20;

function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

const heatmapData = computed(() => {
  const progress = dashboardData.value?.progress || [];
  const levels: number[] = [];

  for (let i = 0; i < progress.length; i++) {
    const day = progress[i];
    const prev = i > 0 ? progress[i - 1] : null;
    const dailyDone = prev ? Math.max(0, day.done - prev.done) : 0;
    const dailyActivity = dailyDone + (day.inProgress > 0 ? 1 : 0);
    levels.push(
      dailyActivity === 0 ? 0 :
      dailyActivity <= 1 ? 1 :
      dailyActivity <= 3 ? 2 :
      dailyActivity <= 6 ? 3 : 4,
    );
  }

  // Pad to fill 20×5 grid
  const totalCells = heatmapCols * 5;
  while (levels.length < totalCells) {
    levels.unshift(0);
  }

  const weeks: number[][] = [];
  for (let w = 0; w < heatmapCols; w++) {
    weeks.push(levels.slice(w * 5, w * 5 + 5));
  }
  return weeks;
});

function heatmapColor(level: number): string {
  const colors = [
    'rgba(0,0,0,0.04)',
    'rgba(103,58,183,0.15)',
    'rgba(103,58,183,0.3)',
    'rgba(103,58,183,0.55)',
    'rgba(103,58,183,0.85)',
  ];
  return colors[level] || colors[0];
}

// ═══════════════════════════════════════════
// My Work: Today's Focus
// ═══════════════════════════════════════════
const todayTasks = computed<FocusTask[]>(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Tasks due today
  const dueTodayTasks = recentTasks.value.filter(t => {
    if (!t.dueAt) return false;
    const d = new Date(t.dueAt);
    return d >= today && d < tomorrow;
  });

  // In-progress tasks not already in due-today list
  const inProgressTasks = recentTasks.value.filter(t =>
    t.state === WorkPackageTaskState.InProgress &&
    !dueTodayTasks.some(dt => dt.id === t.id),
  );

  return [...dueTodayTasks, ...inProgressTasks].slice(0, 5).map((t, i) => ({
    id: i,
    taskId: t.id,
    title: t.title,
    project: projectMap.value.get(t.projectId) || '',
    status: mapTaskState(t.state),
    time: t.state === WorkPackageTaskState.Done
      ? fromNow(t.doneAt)
      : t.state === WorkPackageTaskState.InProgress
        ? 'In Progress'
        : t.state === WorkPackageTaskState.Blocked || t.state === WorkPackageTaskState.Blocker
          ? 'Blocked'
          : 'Pending',
  }));
});

const todayDoneCount = computed(() => todayTasks.value.filter(t => t.status === 'done').length);

// ═══════════════════════════════════════════
// My Work: Stats
// ═══════════════════════════════════════════
const myStats = computed<MyStat[]>(() => {
  const overall = dashboardData.value?.overall;
  const progress = dashboardData.value?.progress || [];
  const last7 = progress.slice(-7);

  return [
    {
      value: overall?.done || 0,
      label: 'Completed',
      sparkData: makeSparkData(last7.map(d => d.done), '#74d68c'),
    },
    {
      value: overall?.inProgress || 0,
      label: 'Active',
      sparkData: makeSparkData(last7.map(d => d.inProgress), '#59a8ef'),
    },
    {
      value: overall?.blocked || 0,
      label: 'Blocked',
      sparkData: makeSparkData(last7.map(d => d.blocked), '#ee6285'),
    },
  ];
});

// Streak: consecutive days with activity
const streak = computed(() => {
  const progress = dashboardData.value?.progress || [];
  let count = 0;
  for (let i = progress.length - 1; i >= 0; i--) {
    const day = progress[i];
    const prev = i > 0 ? progress[i - 1] : null;
    const dailyDone = prev ? Math.max(0, day.done - prev.done) : 0;
    if (dailyDone > 0 || day.inProgress > 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
});

// ═══════════════════════════════════════════
// My Work: Schedule
// ═══════════════════════════════════════════
const scheduleGroups = computed<ScheduleGroup[]>(() => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

  const todayItems: ScheduleItem[] = [];
  const tomorrowItems: ScheduleItem[] = [];
  const weekItems: ScheduleItem[] = [];

  for (const task of recentTasks.value) {
    if (!task.dueAt || task.state === WorkPackageTaskState.Done) continue;
    const dueDate = new Date(task.dueAt);
    dueDate.setHours(0, 0, 0, 0);

    const item: ScheduleItem = {
      taskId: task.id,
      title: task.title,
      project: projectMap.value.get(task.projectId) || '',
      color: stateColor(task.state),
    };

    if (dueDate.getTime() === today.getTime()) {
      todayItems.push(item);
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      tomorrowItems.push(item);
    } else if (dueDate > tomorrow && dueDate <= endOfWeek) {
      weekItems.push(item);
    }
  }

  const groups: ScheduleGroup[] = [];
  if (todayItems.length) groups.push({ label: 'TODAY', icon: 'mdi mdi-clock-outline', items: todayItems });
  if (tomorrowItems.length) groups.push({ label: 'TOMORROW', icon: 'mdi mdi-calendar-arrow-right', items: tomorrowItems });
  if (weekItems.length) groups.push({ label: 'THIS WEEK', icon: 'mdi mdi-calendar-week', items: weekItems });

  if (!groups.length) {
    groups.push({ label: 'NO UPCOMING TASKS', icon: 'mdi mdi-calendar-check', items: [] });
  }

  return groups;
});

// ═══════════════════════════════════════════
// My Work: Activity
// ═══════════════════════════════════════════
const myActivities = computed<ActivityItem[]>(() => {
  return recentTasks.value.slice(0, 8).map(t => {
    let action = 'updated';
    if (t.state === WorkPackageTaskState.Done && t.doneAt) {
      action = 'completed';
    } else if (
      t.createdAt && t.updatedAt &&
      Math.abs(new Date(t.createdAt).getTime() - new Date(t.updatedAt).getTime()) < 60000
    ) {
      action = 'created';
    }

    return {
      taskId: t.id,
      user: 'You',
      action,
      task: t.title,
      time: fromNow(t.updatedAt),
      color: stateColor(t.state),
    };
  });
});

// ═══════════════════════════════════════════
// Manager: Metrics
// ═══════════════════════════════════════════
const managerMetrics = computed<ManagerMetric[]>(() => {
  const overall = dashboardData.value?.overall;
  const progress = dashboardData.value?.progress || [];
  const last7 = progress.slice(-7);
  const prev7 = progress.slice(-14, -7);

  const projectCount = projectStore.projects.length;
  const totalDone = overall?.done || 0;
  const totalActive = overall?.inProgress || 0;
  const totalBlocked = overall?.blocked || 0;
  const totalAll = overall?.total || 1;
  const doneRate = Math.round((totalDone / totalAll) * 100);

  // Trends: compare last 7 vs prev 7
  const doneThisWeek = last7.reduce((s, d) => s + d.done, 0);
  const donePrevWeek = prev7.reduce((s, d) => s + d.done, 0);
  const doneDiff = doneThisWeek - donePrevWeek;

  const activeNow = last7.length ? last7[last7.length - 1].inProgress : 0;
  const activePrev = prev7.length ? prev7[prev7.length - 1].inProgress : 0;
  const activeDiff = activeNow - activePrev;

  const blockedNow = last7.length ? last7[last7.length - 1].blocked : 0;
  const blockedPrev = prev7.length ? prev7[prev7.length - 1].blocked : 0;
  const blockedDiff = blockedNow - blockedPrev;

  return [
    {
      value: projectCount, label: 'Projects',
      trend: `${projectCount} total`, trendUp: true,
      accent: '#673AB7', type: 'sparkline',
      sparkData: makeSparkData(last7.map(() => projectCount), '#673AB7'),
    },
    {
      value: totalDone, label: 'Completed',
      trend: `${doneDiff >= 0 ? '+' : ''}${doneDiff} this week`, trendUp: doneDiff >= 0,
      accent: '#74d68c', type: 'sparkline',
      sparkData: makeSparkData(last7.map(d => d.done), '#74d68c'),
    },
    {
      value: totalActive, label: 'Active',
      trend: `${activeDiff >= 0 ? '+' : ''}${activeDiff} vs last week`, trendUp: activeDiff <= 0,
      accent: '#59a8ef', type: 'sparkline',
      sparkData: makeSparkData(last7.map(d => d.inProgress), '#59a8ef'),
    },
    {
      value: totalBlocked, label: 'Blocked',
      trend: `${blockedDiff >= 0 ? '+' : ''}${blockedDiff} vs last week`, trendUp: blockedDiff <= 0,
      accent: '#ee6285', type: 'sparkline',
      sparkData: makeSparkData(last7.map(d => d.blocked), '#ee6285'),
    },
    {
      value: doneRate, label: 'Done Rate',
      trend: `${doneRate}% completion`, trendUp: true,
      accent: '#673AB7', type: 'ring',
    },
  ];
});

// ═══════════════════════════════════════════
// Manager: Task Distribution
// ═══════════════════════════════════════════
const distribution = computed(() => {
  const overall = dashboardData.value?.overall;
  if (!overall) return { done: 0, active: 0, blocked: 0, todo: 0 };
  const todo = Math.max(0, overall.total - overall.done - overall.inProgress - overall.blocked);
  return { done: overall.done, active: overall.inProgress, blocked: overall.blocked, todo };
});

const distributionTotal = computed(() => {
  const d = distribution.value;
  return d.done + d.active + d.blocked + d.todo;
});

const distributionItems = computed(() => [
  { label: 'Done', value: distribution.value.done, color: '#74d68c' },
  { label: 'Active', value: distribution.value.active, color: '#59a8ef' },
  { label: 'Blocked', value: distribution.value.blocked, color: '#ee6285' },
  { label: 'To Do', value: distribution.value.todo, color: '#d4d4d8' },
]);

// ═══════════════════════════════════════════
// Manager: Project Health
// ═══════════════════════════════════════════
const memberColors = ['#ded4e4', '#d4e4de', '#e4d4d4', '#d4dde4', '#e4e4d4', '#e8e8e8'];

const projects = computed<ProjectHealth[]>(() => {
  return projectStore.projects.slice(0, 6).map((p, pi) => {
    const totalTasks = p.tasks || 0;
    // Estimate progress from recent tasks for this project
    const projTasks = recentTasks.value.filter(t => t.projectId === p.id);
    const doneTasks = projTasks.filter(t => t.state === WorkPackageTaskState.Done).length;
    const progress = totalTasks > 0
      ? Math.round((doneTasks / Math.max(totalTasks, doneTasks)) * 100)
      : 0;

    const members: ProjectMember[] = ((p as any).members || []).slice(0, 3).map((m: any, mi: number) => ({
      initials: m.member?.initials || '??',
      color: memberColors[mi % memberColors.length],
    }));

    if (((p as any).members || []).length > 3) {
      members.push({ initials: `+${(p as any).members.length - 3}`, color: '#e8e8e8' });
    }

    return {
      id: p.id,
      name: p.title,
      progress,
      tasks: totalTasks,
      members,
      color: ['#673AB7', '#7c4dbd', '#9575CD', '#b39ddb', '#59a8ef', '#74d68c'][pi % 6],
    };
  });
});

// ═══════════════════════════════════════════
// Manager: Team Workload
// ═══════════════════════════════════════════
const workloadColors = ['#673AB7', '#7c4dbd', '#9575CD', '#b39ddb', '#59a8ef', '#74d68c'];

const teamMembers = computed<TeamMember[]>(() => {
  const memberMap = new Map<string, { tasks: number }>();

  for (const task of recentTasks.value) {
    for (const m of (task.members || [])) {
      const existing = memberMap.get(m.recordId);
      if (existing) {
        existing.tasks++;
      } else {
        memberMap.set(m.recordId, { tasks: 1 });
      }
    }
  }

  return Array.from(memberMap.entries())
    .sort((a, b) => b[1].tasks - a[1].tasks)
    .slice(0, 6)
    .map(([userId, data], i) => {
      const isMe = userId === authStore.userId;
      return {
        name: isMe ? 'You' : (resolveUserName(userId) || 'Member'),
        initials: isMe ? (authStore.profile?.initials || 'YO') : (resolveUserInitials(userId) || '??'),
        tasks: data.tasks,
        capacity: 30,
        color: workloadColors[i % workloadColors.length],
      };
    });
});

// ═══════════════════════════════════════════
// Manager: Risk & Attention
// ═══════════════════════════════════════════
const risks = computed<RiskItem[]>(() => {
  const items: RiskItem[] = [];
  const overall = dashboardData.value?.overall;
  const events = dashboardData.value?.events || [];

  // Overdue tasks
  const now = new Date();
  const overdue = events.filter(e => {
    const d = new Date(e.date);
    return d < now && e.state !== WorkPackageTaskState.Done;
  });
  if (overdue.length > 0) {
    items.push({ text: `${overdue.length} tasks overdue`, severity: 'critical' });
  }

  // Unassigned tasks
  const unassigned = recentTasks.value.filter(t =>
    (!t.members || t.members.length === 0) &&
    t.state !== WorkPackageTaskState.Done,
  );
  if (unassigned.length > 0) {
    items.push({ text: `${unassigned.length} tasks with no assignee`, severity: 'warning' });
  }

  // Blocked tasks
  if (overall && overall.blocked > 0) {
    items.push({ text: `${overall.blocked} tasks are blocked`, severity: 'warning' });
  }

  if (items.length === 0) {
    items.push({ text: 'All tasks are on track', severity: 'ok' });
  } else {
    items.push({ text: 'Active monitoring in progress', severity: 'ok' });
  }

  return items;
});

// ═══════════════════════════════════════════
// Manager: Milestones
// ═══════════════════════════════════════════
const milestones = computed<Milestone[]>(() => {
  const events = dashboardData.value?.events || [];
  const now = new Date();

  return events
    .filter(e => new Date(e.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 6)
    .map(e => {
      const d = new Date(e.date);
      return {
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        title: taskTitleMap.value.get(e.recordId) || 'Upcoming task',
        tasks: 1,
      };
    });
});

// ═══════════════════════════════════════════
// Manager: Team Activity
// ═══════════════════════════════════════════
const teamActivities = computed<ActivityItem[]>(() => {
  return recentTasks.value.slice(0, 8).map(t => {
    let userId = t.userId;
    let action = 'updated';

    if (t.state === WorkPackageTaskState.Done && t.doneUserId) {
      userId = t.doneUserId;
      action = 'completed';
    } else if (
      t.createdAt && t.updatedAt &&
      Math.abs(new Date(t.createdAt).getTime() - new Date(t.updatedAt).getTime()) < 60000
    ) {
      action = 'created';
    }

    const isMe = userId === authStore.userId;
    const user = isMe ? 'You' : (resolveUserName(userId) || 'Someone');

    return {
      taskId: t.id,
      user,
      action,
      task: t.title,
      time: fromNow(t.updatedAt),
      color: stateColor(t.state),
    };
  });
});

// ═══════════════════════════════════════════
// Manager: Velocity Chart
// ═══════════════════════════════════════════
const velocityChartData = computed(() => {
  const progress = dashboardData.value?.progress || [];
  const last = progress.slice(-selectedPeriod.value);

  const labels: string[] = [];
  const done: number[] = [];
  const created: number[] = [];
  const blocked: number[] = [];

  for (let i = 0; i < last.length; i++) {
    const d = new Date(last[i].date);
    labels.push(`${d.getMonth() + 1}/${d.getDate()}`);
    const prev = i > 0 ? last[i - 1] : null;
    done.push(prev ? Math.max(0, last[i].done - prev.done) : 0);
    created.push(prev ? Math.max(0, last[i].total - prev.total) : last[i].total);
    blocked.push(last[i].blocked);
  }

  return {
    labels,
    datasets: [
      {
        label: 'Completed',
        data: done,
        borderColor: '#74d68c',
        backgroundColor: 'rgba(116, 214, 140, 0.08)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Created',
        data: created,
        borderColor: '#59a8ef',
        backgroundColor: 'rgba(89, 168, 239, 0.05)',
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'Blocked',
        data: blocked,
        borderColor: '#ee6285',
        backgroundColor: 'transparent',
        borderDash: [4, 4],
        tension: 0.4,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };
});

const velocityChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a1a',
      titleFont: { size: 12, weight: 'normal' as const },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 8,
      boxPadding: 4,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: { color: '#a1a1aa', font: { size: 11 }, maxTicksLimit: 10 },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      border: { display: false },
      ticks: { color: '#a1a1aa', font: { size: 11 }, padding: 8 },
      beginAtZero: true,
    },
  },
};

// ═══════════════════════════════════════════
// Manager: Doughnut Chart
// ═══════════════════════════════════════════
const doughnutData = computed(() => ({
  labels: ['Done', 'Active', 'Blocked', 'To Do'],
  datasets: [{
    data: [distribution.value.done, distribution.value.active, distribution.value.blocked, distribution.value.todo],
    backgroundColor: ['#74d68c', '#59a8ef', '#ee6285', '#e4e4e7'],
    borderWidth: 0,
    hoverOffset: 4,
  }],
}));

const doughnutOptions = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '72%',
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1a1a',
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
};
</script>

<style scoped lang="scss">
@use '@/styles/variables' as *;

// ═══════════════════════════════════════════
// Container
// ═══════════════════════════════════════════
.dp {
  min-height: calc(100vh - 48px);
  background: #f8f9fb;
  padding: 28px 32px;
  max-width: 1280px;
  margin: 0 auto;
}

.dp-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

// ═══════════════════════════════════════════
// Header
// ═══════════════════════════════════════════
.dp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
  flex-wrap: wrap;
  gap: 16px;

  &__left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__greeting {
    font-size: 1.35rem;
    font-weight: 700;
    color: $text-primary;
    margin: 0;
    letter-spacing: -0.01em;
  }

  &__date {
    font-size: 0.78rem;
    color: $text-secondary;
  }
}

// ═══════════════════════════════════════════
// Mode Switcher
// ═══════════════════════════════════════════
.dp-mode-switch {
  display: flex;
  position: relative;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 10px;
  padding: 3px;
  gap: 2px;

  &__btn {
    position: relative;
    z-index: 1;
    padding: 7px 18px;
    border: none;
    background: transparent;
    font-size: 0.78rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    border-radius: 8px;
    transition: color 0.2s;
    display: flex;
    align-items: center;
    gap: 6px;
    color: $text-secondary;
    white-space: nowrap;

    &.active { color: $primary; }
    .mdi { font-size: 16px; }
  }

  &__pill {
    position: absolute;
    top: 3px;
    inset-inline-start: 3px;
    width: calc(50% - 4px);
    height: calc(100% - 6px);
    background: $surface;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

    &.right {
      transform: translateX(calc(100% + 2px));
    }
  }
}

// ═══════════════════════════════════════════
// Transition
// ═══════════════════════════════════════════
.dp-fade-enter-active,
.dp-fade-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.dp-fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.dp-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

// ═══════════════════════════════════════════
// Card Base
// ═══════════════════════════════════════════
.dp-card {
  background: $surface;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 20px 24px;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  &--hero {
    border-top: none;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, $primary, #9575CD);
    }
  }

  &__title {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-secondary;
    margin-bottom: 16px;
    display: block;

    &--inline { margin-bottom: 0; }
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
    flex-wrap: wrap;
    gap: 10px;
  }

  &__head-right {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

// ═══════════════════════════════════════════
// Section Headers
// ═══════════════════════════════════════════
.dp-section {
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: $text-secondary;
  }

  &__badge {
    font-size: 0.68rem;
    font-weight: 600;
    color: $text-disabled;
    background: rgba(0, 0, 0, 0.04);
    padding: 3px 10px;
    border-radius: 10px;
  }
}

// ═══════════════════════════════════════════
// Today's Focus Grid
// ═══════════════════════════════════════════
.dp-focus-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.dp-focus-card {
  padding: 14px 16px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-left: 4px solid;
  background: $surface;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
  min-width: 0;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }

  &--done {
    border-left-color: #74d68c;
    i { color: #16a34a; }
  }
  &--active {
    border-left-color: #59a8ef;
    i { color: #2563eb; }
  }
  &--blocked {
    border-left-color: #ee6285;
    i { color: #dc2626; }
  }
  &--todo {
    border-left-color: #d4d4d8;
    i { color: #a1a1aa; }
  }

  i { font-size: 18px; margin-top: 1px; flex-shrink: 0; }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__title {
    font-size: 0.8rem;
    font-weight: 600;
    color: $text-primary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__project {
    font-size: 0.68rem;
    color: $text-secondary;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__time {
    font-size: 0.62rem;
    color: $text-disabled;
    margin-top: 4px;
  }
}

// ═══════════════════════════════════════════
// Grids
// ═══════════════════════════════════════════
.dp-stats-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.dp-grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.dp-metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
  min-width: 0;
}

// ═══════════════════════════════════════════
// My Stats Card
// ═══════════════════════════════════════════
.dp-stats-card {
  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;

    .dp-card__title { margin-bottom: 0; }
  }

  &__streak {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.72rem;
    font-weight: 700;
    color: #f59e0b;
    background: rgba(245, 158, 11, 0.08);
    padding: 3px 10px;
    border-radius: 10px;

    .mdi { font-size: 14px; }
  }

  &__metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

.dp-stat {
  display: flex;
  flex-direction: column;

  &__value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    color: $text-primary;
  }

  &__label {
    font-size: 0.68rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $text-secondary;
    margin-top: 4px;
  }

  &__sparkline {
    height: 40px;
    margin-top: 8px;
  }
}

// ═══════════════════════════════════════════
// Heatmap
// ═══════════════════════════════════════════
.dp-heatmap-card {
  display: flex;
  flex-direction: column;
}

.dp-heatmap-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.dp-heatmap {
  width: 100%;
  height: auto;

  &__label {
    font-size: 8px;
    fill: $text-disabled;
    dominant-baseline: middle;
  }

  &__legend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.6rem;
    color: $text-disabled;
    margin-top: 8px;
    justify-content: flex-end;
  }

  &__swatch {
    width: 10px;
    height: 10px;
    border-radius: 2px;
  }
}

// ═══════════════════════════════════════════
// Schedule
// ═══════════════════════════════════════════
.dp-schedule {
  display: flex;
  flex-direction: column;
  gap: 16px;

  &__group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__group-label {
    font-size: 0.65rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: $text-disabled;
    display: flex;
    align-items: center;
    gap: 5px;

    .mdi { font-size: 13px; }
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 0;
    padding-inline-start: 18px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.03);
    border-radius: 6px;
    transition: background 0.12s;

    &:last-child { border-bottom: none; }

    &--clickable {
      cursor: pointer;
      &:hover { background: rgba(0, 0, 0, 0.02); }
    }
  }

  &__dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 500;
    color: $text-primary;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__project {
    font-size: 0.68rem;
    color: $text-disabled;
    flex-shrink: 0;
  }
}

// ═══════════════════════════════════════════
// Activity (shared between modes)
// ═══════════════════════════════════════════
.dp-activity-list {
  display: flex;
  flex-direction: column;
}

.dp-activity-item {
  display: flex;
  gap: 12px;
  padding: 11px 0;
  border-radius: 6px;
  transition: background 0.12s;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  &--clickable {
    cursor: pointer;
    &:hover { background: rgba(0, 0, 0, 0.02); }
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 5px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  &__text {
    font-size: 0.8rem;
    color: $text-primary;
    line-height: 1.4;

    strong { font-weight: 600; }
  }

  &__time {
    font-size: 0.65rem;
    color: $text-disabled;
  }
}

// ═══════════════════════════════════════════
// Manager: Metric Cards
// ═══════════════════════════════════════════
.dp-metric-card {
  border-left: 4px solid;
  min-width: 0;
  overflow: hidden;

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }

  &__value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    color: $text-primary;
  }

  &__label {
    font-size: 0.68rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: $text-secondary;
    margin-top: 4px;
  }

  &__trend {
    font-size: 0.6rem;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 2px;
    white-space: nowrap;

    .mdi { font-size: 12px; }

    &.up {
      background: rgba(116, 214, 140, 0.12);
      color: #16a34a;
    }
    &.down {
      background: rgba(238, 98, 133, 0.12);
      color: #dc2626;
    }
  }

  &__spark {
    height: 40px;
    margin-top: 10px;
  }

  &__ring {
    width: 56px;
    height: 56px;
    margin-top: 10px;
  }
}

.dp-ring-path {
  transform: rotate(-90deg);
  transform-origin: 50% 50%;
  transition: stroke-dashoffset 0.8s ease-in-out;
}

.dp-ring-text {
  font-size: 7px;
  font-weight: 700;
  fill: $text-primary;
}

// ═══════════════════════════════════════════
// Chart legends & period selector
// ═══════════════════════════════════════════
.dp-chart-legend {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 0.68rem;
  color: $text-secondary;

  i {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
}

.dp-period {
  display: flex;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;

  &__btn {
    padding: 4px 12px;
    border: none;
    background: none;
    font-size: 0.68rem;
    font-weight: 600;
    color: $text-secondary;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.12s;

    &:not(:last-child) {
      border-inline-end: 1px solid rgba(0, 0, 0, 0.1);
    }

    &:hover { background: rgba(0, 0, 0, 0.02); }

    &.active {
      background: $text-primary;
      color: #fff;
    }
  }
}

// ═══════════════════════════════════════════
// Velocity Chart
// ═══════════════════════════════════════════
.dp-velocity-card {
  .dp-card__title { margin-bottom: 0; }
}

.dp-velocity-chart {
  height: 200px;
}

// ═══════════════════════════════════════════
// Task Distribution
// ═══════════════════════════════════════════
.dp-distribution {
  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  &__chart {
    width: 180px;
    height: 180px;
    position: relative;
  }

  &__center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
  }

  &__total {
    font-size: 1.5rem;
    font-weight: 700;
    color: $text-primary;
    line-height: 1;
  }

  &__total-label {
    font-size: 0.65rem;
    color: $text-secondary;
    margin-top: 2px;
  }

  &__legend {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    justify-content: center;
  }

  &__leg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 0.72rem;
    color: $text-secondary;
  }

  &__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  &__leg-value {
    font-weight: 600;
    color: $text-primary;
  }
}

// ═══════════════════════════════════════════
// Project Health
// ═══════════════════════════════════════════
.dp-health-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dp-health-item {
  display: flex;
  flex-direction: column;
  gap: 6px;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 600;
    color: $text-primary;
  }

  &__pct {
    font-size: 0.72rem;
    font-weight: 700;
    color: $text-secondary;
  }

  &__bar {
    height: 6px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 3px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  &__meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 0.68rem;
    color: $text-disabled;
  }
}

// ═══════════════════════════════════════════
// Avatar Stack
// ═══════════════════════════════════════════
.dp-avatar-stack {
  display: flex;
}

.dp-avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid $surface;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.48rem;
  font-weight: 700;
  color: $primary;

  &:not(:first-child) {
    margin-inline-start: -6px;
  }

  &--sm {
    width: 26px;
    height: 26px;
    font-size: 0.52rem;
    border: none;
    flex-shrink: 0;
  }
}

// ═══════════════════════════════════════════
// Team Workload
// ═══════════════════════════════════════════
.dp-workload-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dp-workload-item {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__info {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__name {
    font-size: 0.82rem;
    font-weight: 500;
    color: $text-primary;
    flex: 1;
  }

  &__count {
    font-size: 0.68rem;
    color: $text-disabled;
    flex-shrink: 0;
  }

  &__bar {
    height: 8px;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    overflow: hidden;
  }

  &__bar-fill {
    height: 100%;
    border-radius: 4px;
    transition: width 0.6s ease;
  }
}

// ═══════════════════════════════════════════
// Risk Items
// ═══════════════════════════════════════════
.dp-risk-list {
  display: flex;
  flex-direction: column;
}

.dp-risk-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  &__text {
    font-size: 0.82rem;
    color: $text-primary;
    line-height: 1.4;
  }
}

.dp-risk-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;

  &--critical { background: #ee6285; }
  &--warning { background: #fbbf24; }
  &--ok { background: #4ade80; }
}

// ═══════════════════════════════════════════
// Milestones
// ═══════════════════════════════════════════
.dp-milestone-list {
  display: flex;
  flex-direction: column;
}

.dp-milestone-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 11px 0;

  &:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  }

  &__date {
    font-size: 0.72rem;
    font-weight: 700;
    color: $primary;
    min-width: 44px;
    flex-shrink: 0;
  }

  &__title {
    font-size: 0.82rem;
    font-weight: 500;
    color: $text-primary;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__badge {
    font-size: 0.65rem;
    font-weight: 500;
    color: $text-secondary;
    background: rgba(0, 0, 0, 0.04);
    padding: 3px 10px;
    border-radius: 10px;
    white-space: nowrap;
  }
}

// ═══════════════════════════════════════════
// Responsive
// ═══════════════════════════════════════════
@media (max-width: 1100px) {
  .dp-metrics-grid { grid-template-columns: repeat(3, 1fr); }
  .dp-focus-grid { grid-template-columns: repeat(3, 1fr); }
  .dp-grid-2col,
  .dp-stats-row { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .dp-metrics-grid { grid-template-columns: repeat(2, 1fr); }
  .dp-focus-grid { grid-template-columns: repeat(2, 1fr); }
  .dp-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 600px) {
  .dp { padding: 12px; }
  .dp-body { gap: 14px; }
  .dp-metrics-grid { grid-template-columns: 1fr; }
  .dp-focus-grid { grid-template-columns: 1fr; }
  .dp-stats-card__metrics { grid-template-columns: 1fr; }
  .dp-velocity-chart { height: 160px; }
  .dp-card__head { flex-direction: column; align-items: flex-start; }
  .dp-card { padding: 14px 12px; }
  .dp-header {
    margin-bottom: 16px;
    &__greeting { font-size: 1.1rem; }
  }
  .dp-mode-switch__btn { padding: 6px 12px; font-size: 0.72rem; }
  .dp-section__head { margin-bottom: 8px; }
}

@media (max-width: 400px) {
  .dp { padding: 8px; }
  .dp-card { padding: 12px 10px; border-radius: 10px; }
  .dp-header__greeting { font-size: 1rem; }
}
</style>

<!-- Dark mode (non-scoped) -->
<style lang="scss">
@use '@/styles/variables' as *;

body.dark-mode {
  .dp { background: $dark-background; }

  .dp-header {
    &__greeting { color: $dark-text-bright; }
    &__date { color: $dark-text-muted; }
  }

  .dp-mode-switch {
    background: rgba(255, 255, 255, 0.06);
    &__btn {
      color: $dark-text-muted;
      &.active { color: $primary-light; }
    }
    &__pill {
      background: $dark-card;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
    }
  }

  .dp-card {
    background: $dark-card;
    border-color: $dark-border;
    &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
    &__title { color: $dark-text-muted; }
  }

  .dp-section {
    &__title { color: $dark-text-muted; }
    &__badge { background: rgba(255, 255, 255, 0.06); color: $dark-text-muted; }
  }

  .dp-focus-card {
    background: $dark-card;
    border-color: $dark-border;
    &:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2); }
    &__title { color: $dark-text-bright; }
    &__project { color: $dark-text-muted; }
    &__time { color: #666; }
  }

  .dp-stats-card__streak {
    background: rgba(245, 158, 11, 0.12);
  }

  .dp-stat {
    &__value { color: $dark-text-bright; }
    &__label { color: $dark-text-muted; }
  }

  .dp-heatmap {
    &__label { fill: #666; }
    &__legend { color: #666; }
  }

  .dp-heatmap rect {
    opacity: 0.85;
  }

  .dp-schedule {
    &__group-label { color: #666; }
    &__item {
      border-color: rgba(255, 255, 255, 0.04);
      &--clickable:hover { background: rgba(255, 255, 255, 0.03); }
    }
    &__name { color: $dark-text-bright; }
    &__project { color: #666; }
    &__dot { box-shadow: 0 0 0 2px $dark-card; }
  }

  .dp-activity-item {
    &:not(:last-child) { border-color: rgba(255, 255, 255, 0.05); }
    &--clickable:hover { background: rgba(255, 255, 255, 0.03); }
    &__text { color: $dark-text-light; strong { color: $dark-text-bright; } }
    &__time { color: #555; }
  }

  .dp-metric-card {
    border-color: $dark-border;
    &__value { color: $dark-text-bright; }
    &__label { color: $dark-text-muted; }
    &__trend.up { background: rgba(74, 222, 128, 0.12); color: #4ade80; }
    &__trend.down { background: rgba(248, 113, 113, 0.12); color: #f87171; }
  }

  .dp-ring-text { fill: $dark-text-bright; }
  .dp-ring-path + circle:first-of-type { stroke: rgba(255, 255, 255, 0.08); }
  .dp-metric-card__ring svg circle:first-child { stroke: rgba(255, 255, 255, 0.08); }

  .dp-chart-legend { color: $dark-text-muted; }

  .dp-period {
    border-color: $dark-border;
    &__btn {
      color: $dark-text-muted;
      &:not(:last-child) { border-color: $dark-border; }
      &:hover { background: rgba(255, 255, 255, 0.04); }
      &.active { background: $dark-text-bright; color: $dark-background; }
    }
  }

  .dp-distribution {
    &__total { color: $dark-text-bright; }
    &__total-label { color: $dark-text-muted; }
    &__leg-item { color: $dark-text-muted; }
    &__leg-value { color: $dark-text-bright; }
  }

  .dp-health-item {
    &__name { color: $dark-text-bright; }
    &__pct { color: $dark-text-muted; }
    &__bar { background: rgba(255, 255, 255, 0.08); }
    &__meta { color: #666; }
  }

  .dp-avatar {
    border-color: $dark-card;
    background: #4a3d5c;
    color: $primary-light;
  }

  .dp-workload-item {
    &__name { color: $dark-text-bright; }
    &__count { color: #666; }
    &__bar { background: rgba(255, 255, 255, 0.08); }
  }

  .dp-risk-item {
    &:not(:last-child) { border-color: rgba(255, 255, 255, 0.05); }
    &__text { color: $dark-text-light; }
  }

  .dp-milestone-item {
    &:not(:last-child) { border-color: rgba(255, 255, 255, 0.05); }
    &__date { color: $primary-light; }
    &__title { color: $dark-text-bright; }
    &__badge { background: rgba(255, 255, 255, 0.06); color: $dark-text-muted; }
  }
}
</style>

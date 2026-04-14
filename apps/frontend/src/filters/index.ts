import type { MemberInfoViewModel } from '@asoode/shared';

export function culturedDate(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function culturedDateTime(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString();
}

export function momentAgo(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

export function truncate(str: string, length: number): string {
  if (!str) return '';
  if (str.length <= length) return str;
  return str.substring(0, length) + '...';
}

export function stringFormat(template: string, ...args: any[]): string {
  return template.replace(/\{(\d+)\}/g, (match, index) => {
    return args[index] !== undefined ? String(args[index]) : match;
  });
}

export function msDuration(ms: number): string {
  if (!ms || ms <= 0) return '0m';
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export function enterToBr(str: string): string {
  if (!str) return '';
  return str.replace(/\n/g, '<br>');
}

export function fullName(member: MemberInfoViewModel | undefined): string {
  if (!member) return '';
  return member.fullName || `${member.firstName} ${member.lastName}`.trim();
}

export function initials(member: MemberInfoViewModel | undefined): string {
  if (!member) return '';
  if (member.initials) return member.initials;
  const first = member.firstName?.charAt(0) || '';
  const last = member.lastName?.charAt(0) || '';
  return (first + last).toUpperCase();
}

export function estimatedTime(minutes: number | undefined): string {
  if (!minutes) return '';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export function thumbnailUrl(path: string | undefined): string {
  if (!path) return '';
  return `/api${path}`;
}

export function searchFilter<T>(array: T[], prop: keyof T, query: string): T[] {
  if (!query) return array;
  const lowerQuery = query.toLowerCase();
  return array.filter((item) => {
    const val = item[prop];
    return typeof val === 'string' && val.toLowerCase().includes(lowerQuery);
  });
}

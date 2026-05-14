import { Challenge, DayStatus, Habit } from './types';

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function dateToStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

export function isCompletedToday(habit: Habit): boolean {
  const today = todayStr();
  const c = habit.completions.find((c) => c.date === today);
  return !!c && c.count >= habit.targetCount;
}

export function countForDate(habit: Habit, date: string): number {
  return habit.completions.find((c) => c.date === date)?.count ?? 0;
}

export function calcStreak(habit: Habit): number {
  const completed = habit.completions
    .filter((c) => c.count >= habit.targetCount)
    .map((c) => c.date)
    .sort()
    .reverse();
  if (completed.length === 0) return 0;
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < completed.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (completed[i] === dateToStr(expected)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export function getChallengeDays(
  challenge: Challenge,
  habit: Habit
): { date: string; status: DayStatus }[] {
  const start = new Date(challenge.startDate + 'T00:00:00');
  const todaySt = todayStr();
  return Array.from({ length: challenge.durationDays }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const dayStr = dateToStr(day);
    const c = habit.completions.find((c) => c.date === dayStr);
    const done = !!c && c.count >= habit.targetCount;
    let status: DayStatus;
    if (dayStr > todaySt) status = 'future';
    else if (dayStr === todaySt) status = done ? 'done' : 'today';
    else status = done ? 'done' : 'missed';
    return { date: dayStr, status };
  });
}

export function computeChallengeStatus(
  challenge: Challenge,
  habit: Habit
): 'active' | 'completed' | 'failed' {
  const days = getChallengeDays(challenge, habit);
  if (days.some((d) => d.status === 'missed')) return 'failed';
  if (days.every((d) => d.status === 'done')) return 'completed';
  return 'active';
}

export function last30Days(): string[] {
  const days: string[] = [];
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateToStr(d));
  }
  return days;
}

export function last7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(dateToStr(d));
  }
  return days;
}

export function shortDayLabel(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' });
}

export function friendlyDate(dateStr: string): string {
  const today = todayStr();
  const yesterday = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return dateToStr(d);
  })();
  if (dateStr === today) return 'Today';
  if (dateStr === yesterday) return 'Yesterday';
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

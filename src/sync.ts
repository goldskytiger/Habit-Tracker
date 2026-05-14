import { supabase } from './supabase';
import { Challenge, Habit } from './types';

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchAllData(userId: string): Promise<{ habits: Habit[]; challenges: Challenge[] }> {
  const [habitsRes, challengesRes] = await Promise.all([
    supabase
      .from('habits')
      .select('*, habit_completions(date, count)')
      .eq('user_id', userId)
      .order('inserted_at', { ascending: true }),
    supabase
      .from('challenges')
      .select('*')
      .eq('user_id', userId)
      .order('inserted_at', { ascending: true }),
  ]);

  if (habitsRes.error) throw habitsRes.error;
  if (challengesRes.error) throw challengesRes.error;

  const habits: Habit[] = (habitsRes.data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    emoji: row.emoji,
    type: row.type,
    targetCount: row.target_count,
    completions: (row.habit_completions ?? []).map((c: { date: string; count: number }) => ({
      date: c.date,
      count: c.count,
    })),
    createdAt: row.created_at,
    color: row.color,
  }));

  const challenges: Challenge[] = (challengesRes.data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    habitId: row.habit_id,
    durationDays: row.duration_days,
    startDate: row.start_date,
    status: row.status,
  }));

  return { habits, challenges };
}

// ─── Habit mutations ──────────────────────────────────────────────────────────

export async function pushAddedHabits(habits: Habit[], userId: string): Promise<void> {
  if (habits.length === 0) return;
  const { error } = await supabase.from('habits').insert(
    habits.map((h) => ({
      id: h.id,
      user_id: userId,
      name: h.name,
      emoji: h.emoji,
      type: h.type,
      target_count: h.targetCount,
      color: h.color,
      created_at: h.createdAt,
    }))
  );
  if (error) throw error;

  // Insert completions for any habits that somehow already have them (e.g. onboarding)
  const completionRows = habits.flatMap((h) =>
    h.completions.map((c) => ({ habit_id: h.id, user_id: userId, date: c.date, count: c.count }))
  );
  if (completionRows.length > 0) {
    await supabase.from('habit_completions').insert(completionRows);
  }
}

export async function pushDeletedHabits(habitIds: string[]): Promise<void> {
  if (habitIds.length === 0) return;
  const { error } = await supabase.from('habits').delete().in('id', habitIds);
  if (error) throw error;
}

// Replace all completions for a habit (delete + re-insert)
export async function syncHabitCompletions(habit: Habit, userId: string): Promise<void> {
  await supabase.from('habit_completions').delete().eq('habit_id', habit.id);
  if (habit.completions.length > 0) {
    const { error } = await supabase.from('habit_completions').insert(
      habit.completions.map((c) => ({
        habit_id: habit.id,
        user_id: userId,
        date: c.date,
        count: c.count,
      }))
    );
    if (error) throw error;
  }
}

// ─── Challenge mutations ──────────────────────────────────────────────────────

export async function pushAddedChallenges(challenges: Challenge[], userId: string): Promise<void> {
  if (challenges.length === 0) return;
  const { error } = await supabase.from('challenges').insert(
    challenges.map((c) => ({
      id: c.id,
      user_id: userId,
      habit_id: c.habitId,
      title: c.title,
      duration_days: c.durationDays,
      start_date: c.startDate,
      status: c.status,
    }))
  );
  if (error) throw error;
}

export async function pushDeletedChallenges(challengeIds: string[]): Promise<void> {
  if (challengeIds.length === 0) return;
  const { error } = await supabase.from('challenges').delete().in('id', challengeIds);
  if (error) throw error;
}

export async function pushChallengeStatusChanges(
  changes: { id: string; status: string }[]
): Promise<void> {
  for (const { id, status } of changes) {
    const { error } = await supabase.from('challenges').update({ status }).eq('id', id);
    if (error) throw error;
  }
}

// ─── Diff helpers (called from AppContext) ────────────────────────────────────

export function diffHabits(
  prev: Habit[],
  next: Habit[]
): {
  added: Habit[];
  deleted: string[];
  completionChanged: Habit[];
} {
  const added = next.filter((h) => !prev.find((p) => p.id === h.id));
  const deleted = prev.filter((p) => !next.find((n) => n.id === p.id)).map((p) => p.id);
  const completionChanged = next.filter((h) => {
    const p = prev.find((p) => p.id === h.id);
    return p && JSON.stringify(p.completions) !== JSON.stringify(h.completions);
  });
  return { added, deleted, completionChanged };
}

export function diffChallenges(
  prev: Challenge[],
  next: Challenge[]
): {
  added: Challenge[];
  deleted: string[];
  statusChanged: { id: string; status: string }[];
} {
  const added = next.filter((c) => !prev.find((p) => p.id === c.id));
  const deleted = prev.filter((p) => !next.find((n) => n.id === p.id)).map((p) => p.id);
  const statusChanged = next
    .filter((c) => {
      const p = prev.find((p) => p.id === c.id);
      return p && p.status !== c.status;
    })
    .map((c) => ({ id: c.id, status: c.status }));
  return { added, deleted, statusChanged };
}

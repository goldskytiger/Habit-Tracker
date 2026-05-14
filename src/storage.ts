import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge, HABIT_COLORS, Habit } from './types';

const key = {
  habits: (uid?: string) => (uid ? `habits_v2_${uid}` : 'habits_v2'),
  challenges: (uid?: string) => (uid ? `challenges_v1_${uid}` : 'challenges_v1'),
  onboarded: (uid?: string) => (uid ? `has_onboarded_${uid}` : 'has_onboarded'),
};

export async function loadHabits(userId?: string): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(key.habits(userId));
    if (raw) return JSON.parse(raw);
    // Migrate from v1 (pre-auth anonymous data)
    const rawV1 = await AsyncStorage.getItem('habits_v1');
    if (rawV1) {
      const old: any[] = JSON.parse(rawV1);
      const migrated: Habit[] = old.map((h, i) => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        type: 'daily' as const,
        targetCount: 1,
        completions: (h.completedDates ?? []).map((date: string) => ({ date, count: 1 })),
        createdAt: h.createdAt,
        color: HABIT_COLORS[i % HABIT_COLORS.length],
      }));
      await AsyncStorage.removeItem('habits_v1');
      await AsyncStorage.setItem(key.habits(userId), JSON.stringify(migrated));
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveHabits(habits: Habit[], userId?: string): Promise<void> {
  await AsyncStorage.setItem(key.habits(userId), JSON.stringify(habits));
}

export async function loadChallenges(userId?: string): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(key.challenges(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveChallenges(challenges: Challenge[], userId?: string): Promise<void> {
  await AsyncStorage.setItem(key.challenges(userId), JSON.stringify(challenges));
}

export async function getHasOnboarded(userId?: string): Promise<boolean> {
  return (await AsyncStorage.getItem(key.onboarded(userId))) === 'true';
}

export async function setHasOnboarded(userId?: string): Promise<void> {
  await AsyncStorage.setItem(key.onboarded(userId), 'true');
}

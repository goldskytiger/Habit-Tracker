import AsyncStorage from '@react-native-async-storage/async-storage';
import { Challenge, HABIT_COLORS, Habit } from './types';

const HABITS_KEY = 'habits_v2';
const CHALLENGES_KEY = 'challenges_v1';
const ONBOARDED_KEY = 'has_onboarded';

export async function loadHabits(): Promise<Habit[]> {
  try {
    const raw = await AsyncStorage.getItem(HABITS_KEY);
    if (raw) return JSON.parse(raw);
    // Migrate from v1
    const rawV1 = await AsyncStorage.getItem('habits_v1');
    if (rawV1) {
      const old: any[] = JSON.parse(rawV1);
      const migrated: Habit[] = old.map((h, i) => ({
        id: h.id,
        name: h.name,
        emoji: h.emoji,
        type: 'daily',
        targetCount: 1,
        completions: (h.completedDates ?? []).map((date: string) => ({ date, count: 1 })),
        createdAt: h.createdAt,
        color: HABIT_COLORS[i % HABIT_COLORS.length],
      }));
      await AsyncStorage.removeItem('habits_v1');
      await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return [];
  } catch {
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<void> {
  await AsyncStorage.setItem(HABITS_KEY, JSON.stringify(habits));
}

export async function loadChallenges(): Promise<Challenge[]> {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveChallenges(challenges: Challenge[]): Promise<void> {
  await AsyncStorage.setItem(CHALLENGES_KEY, JSON.stringify(challenges));
}

export async function getHasOnboarded(): Promise<boolean> {
  return (await AsyncStorage.getItem(ONBOARDED_KEY)) === 'true';
}

export async function setHasOnboarded(): Promise<void> {
  await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
}

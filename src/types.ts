export type HabitType = 'daily' | 'volume';

export type HabitCompletion = {
  date: string; // YYYY-MM-DD
  count: number;
};

export const HABIT_COLORS = [
  '#6C47FF',
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFBE0B',
  '#FF8C42',
  '#C77DFF',
] as const;

export const EMOJIS = [
  '✅', '💪', '📚', '🏃', '💧', '🧘', '🥗', '😴',
  '✍️', '🎯', '🎸', '🌱', '💊', '🧠', '❤️', '⚡',
  '🏋️', '🍎', '🌞', '🎨',
];

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  type: HabitType;
  targetCount: number;
  completions: HabitCompletion[];
  createdAt: string;
  color: string;
};

export type Challenge = {
  id: string;
  title: string;
  habitId: string;
  durationDays: number;
  startDate: string; // YYYY-MM-DD
  status: 'active' | 'completed' | 'failed';
};

export type DayStatus = 'done' | 'missed' | 'today' | 'future';

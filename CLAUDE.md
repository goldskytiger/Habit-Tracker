# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Start dev server (LAN mode — phone must be on same WiFi, scan QR in Expo Go)
npx expo start --lan

# Start with tunnel (works across networks, slower)
npx expo start --tunnel

# Target a specific platform directly
npm run ios        # opens iOS Simulator
npm run android    # opens Android Emulator
npm run web        # opens browser

# Type-check (no test suite configured)
npx tsc --noEmit

# Install a new Expo-compatible package (uses correct SDK-pinned version)
npx expo install <package>
```

## Architecture

Expo + React Native app (TypeScript strict mode, new architecture enabled). Entry point: `index.ts` → `App.tsx` via `registerRootComponent`. `index.ts` must import `react-native-gesture-handler` as the first line.

### Navigation & root structure

`App.tsx` handles two top-level states:
- **Not onboarded:** renders `<OnboardingScreen>` directly (no NavigationContainer)
- **Onboarded:** renders a `NavigationContainer` wrapping a bottom `Tab.Navigator` with four tabs: Today, Log, Stats, Goals

The entire tree is wrapped in `GestureHandlerRootView` → `SafeAreaProvider` → `AppProvider`.

### State management (`src/AppContext.tsx`)

`AppProvider` is the single source of truth. It loads both `habits` and `challenges` from AsyncStorage on mount, syncs stale challenge statuses, and exposes `updateHabits` / `updateChallenges` — which update React state and persist to storage atomically. All screens call `useApp()` to read and write data; no prop drilling.

### Data model (`src/types.ts`)

```ts
Habit = { id, name, emoji, type: 'daily'|'volume', targetCount, completions: {date, count}[], createdAt, color }
Challenge = { id, title, habitId, durationDays, startDate, status: 'active'|'completed'|'failed' }
```

Storage keys: `habits_v2`, `challenges_v1`, `has_onboarded`. `src/storage.ts` auto-migrates `habits_v1` (old `completedDates: string[]` format) to `habits_v2` on first load.

Challenge status is **derived** from habit completions at runtime via `computeChallengeStatus()` in `src/utils.ts` — the stored `status` field is only updated when a change is detected (on app load in `AppProvider`, and after each habit toggle in `TodayScreen`).

### Screens (`src/screens/`)

| Screen | Tab | Responsibility |
|---|---|---|
| `TodayScreen` | Today | Core loop: toggle/increment habits, fire reward animations, detect challenge completion |
| `LogScreen` | Log | Last 30 days of activity, per-habit completion status per day |
| `StatsScreen` | Stats | 7-day bar chart, per-habit breakdown, streak/consistency summary cards |
| `ChallengesScreen` | Goals | Active/completed/failed challenge cards, new challenge creation modal |
| `OnboardingScreen` | — | 4-step first-launch flow: welcome → create habit → 3-day challenge → notifications |

### Reward system

**Haptics** (`src/rewards.ts`): `hapticComplete` (medium) on single completion, `hapticAllDone` (success + medium) when all habits done, `hapticChallengeComplete` (triple pulse) on challenge finish.

**Visual** (`src/components/RewardBurst.tsx`): 10 colored particles animate outward from center using the built-in `Animated` API. Triggered by `rewardVisible` prop on `HabitRow` — `TodayScreen` sets `rewardId` state for 700ms after a completion.

**Progress ring** (`src/components/ProgressRing.tsx`): SVG arc via `react-native-svg` showing daily completion ratio.

### Notifications (`src/notifications.ts`)

Permission requested during onboarding step 4. Schedules two daily triggers (9am + 7pm) via `expo-notifications`. Handler is set at module level. The `expo-notifications` plugin is configured in `app.json`.

### Styling conventions

- All styles use `StyleSheet.create` inline in the same file as the component.
- Primary brand color: `#6C47FF` (purple), referenced as `const PURPLE` in each file.
- Habit colors auto-assigned from `HABIT_COLORS` array in `src/types.ts` via `habits.length % HABIT_COLORS.length`.
- Safe area is handled with `edges={['top']}` on `SafeAreaView` inside each screen (the tab bar provides bottom inset).

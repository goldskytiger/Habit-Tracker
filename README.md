# Habit Tracker

A React Native habit tracking app built with Expo. Create habits, track them daily, take on streak challenges, and stay accountable with push notifications.

## Features

- **Daily & volume habits** — track once-a-day habits with a checkbox, or multi-rep habits (e.g. "drink water 4×") with a counter
- **Streak tracking** — consecutive-day streaks with fire badge on every habit
- **Challenges** — 3, 7, or 21-day streak challenges with day-by-day progress; onboarding kicks off a 3-day challenge automatically
- **Reward feedback** — haptic pulses + particle burst animation on every completion; triple-pulse celebration when a challenge is finished
- **Activity log** — last 30 days of completions per habit
- **Stats** — 7-day bar chart, per-habit consistency breakdown, best streak and total completions
- **Push notifications** — daily 9am + 7pm reminders (optional, requested during onboarding)

## Tech stack

- [Expo](https://expo.dev) SDK 54 / React Native 0.81
- TypeScript (strict)
- React Navigation (bottom tabs)
- `expo-haptics`, `expo-notifications`
- `react-native-svg` (progress ring)
- `@react-native-async-storage/async-storage` (persistence)

## Running locally

**Prerequisites:** Node.js, the [Expo Go](https://expo.dev/go) app on your phone.

```bash
npm install
npx expo start --lan
```

Scan the QR code with Expo Go (iOS) or the Camera app (Android). Your phone and computer must be on the same WiFi network.

```bash
npm run ios       # iOS Simulator
npm run android   # Android Emulator
npx tsc --noEmit  # type-check
```

## Project structure

```
App.tsx              # root — navigation + onboarding gate
src/
  AppContext.tsx     # global state (habits + challenges)
  types.ts           # Habit, Challenge, shared constants
  storage.ts         # AsyncStorage helpers + v1→v2 migration
  utils.ts           # streak calc, challenge status, date helpers
  rewards.ts         # haptic feedback patterns
  notifications.ts   # permission + daily reminder scheduling
  screens/
    TodayScreen.tsx
    LogScreen.tsx
    StatsScreen.tsx
    ChallengesScreen.tsx
    OnboardingScreen.tsx
  components/
    HabitRow.tsx
    AddHabitModal.tsx
    ProgressRing.tsx
    RewardBurst.tsx
```

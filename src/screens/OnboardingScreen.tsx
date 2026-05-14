import { useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { requestPermission, scheduleReminders } from '../notifications';
import { setHasOnboarded } from '../storage';
import { EMOJIS, HABIT_COLORS, Habit, HabitType } from '../types';
import { todayStr } from '../utils';

type Props = {
  onComplete: () => void;
};

const PURPLE = '#6C47FF';

export function OnboardingScreen({ onComplete }: Props) {
  const { updateHabits, updateChallenges } = useApp();
  const [step, setStep] = useState(0);
  const [habitName, setHabitName] = useState('');
  const [habitEmoji, setHabitEmoji] = useState(EMOJIS[0]);
  const [habitType, setHabitType] = useState<HabitType>('daily');
  const [habitTarget, setHabitTarget] = useState(3);
  const [createdHabit, setCreatedHabit] = useState<Habit | null>(null);
  const inputRef = useRef<TextInput>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  function fadeToStep(next: number) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      setStep(next);
      Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }

  function handleCreateHabit() {
    const name = habitName.trim();
    if (!name) return;
    const habit: Habit = {
      id: Date.now().toString(),
      name,
      emoji: habitEmoji,
      type: habitType,
      targetCount: habitType === 'daily' ? 1 : habitTarget,
      completions: [],
      createdAt: todayStr(),
      color: HABIT_COLORS[0],
    };
    setCreatedHabit(habit);
    updateHabits([habit]);
    fadeToStep(2);
  }

  function handleStartChallenge() {
    if (!createdHabit) return;
    updateChallenges([
      {
        id: Date.now().toString(),
        title: '3-Day Challenge',
        habitId: createdHabit.id,
        durationDays: 3,
        startDate: todayStr(),
        status: 'active',
      },
    ]);
    fadeToStep(3);
  }

  async function handleNotifications(enable: boolean) {
    if (enable) {
      const granted = await requestPermission();
      if (granted && createdHabit) {
        await scheduleReminders([createdHabit.name]);
      }
    }
    await setHasOnboarded();
    onComplete();
  }

  return (
    <SafeAreaView style={styles.safe}>
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {step === 0 && <StepWelcome onNext={() => fadeToStep(1)} />}
        {step === 1 && (
          <StepCreateHabit
            name={habitName}
            onNameChange={setHabitName}
            emoji={habitEmoji}
            onEmojiChange={setHabitEmoji}
            type={habitType}
            onTypeChange={setHabitType}
            target={habitTarget}
            onTargetChange={setHabitTarget}
            inputRef={inputRef}
            onNext={handleCreateHabit}
          />
        )}
        {step === 2 && createdHabit && (
          <StepChallenge
            habit={createdHabit}
            onAccept={handleStartChallenge}
            onSkip={() => fadeToStep(3)}
          />
        )}
        {step === 3 && <StepNotifications onEnable={() => handleNotifications(true)} onSkip={() => handleNotifications(false)} />}
      </Animated.View>
    </SafeAreaView>
  );
}

function StepWelcome({ onNext }: { onNext: () => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.bigEmoji}>🌱</Text>
      <Text style={styles.heading}>Build habits{'\n'}that last</Text>
      <Text style={styles.subheading}>
        Track daily habits, take on challenges, and grow a little every day.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onNext} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepCreateHabit({
  name, onNameChange, emoji, onEmojiChange, type, onTypeChange,
  target, onTargetChange, inputRef, onNext,
}: {
  name: string; onNameChange: (s: string) => void;
  emoji: string; onEmojiChange: (s: string) => void;
  type: HabitType; onTypeChange: (t: HabitType) => void;
  target: number; onTargetChange: (n: number) => void;
  inputRef: React.RefObject<TextInput | null>;
  onNext: () => void;
}) {
  return (
    <ScrollView contentContainerStyle={styles.step} keyboardShouldPersistTaps="handled">
      <Text style={styles.heading}>What habit do{'\n'}you want to build?</Text>

      <Text style={styles.fieldLabel}>NAME</Text>
      <TextInput
        ref={inputRef}
        style={styles.input}
        placeholder="e.g. Drink water, Go for a run…"
        placeholderTextColor="#BBB"
        value={name}
        onChangeText={onNameChange}
        autoFocus
        maxLength={40}
        returnKeyType="done"
        onSubmitEditing={onNext}
      />

      <Text style={styles.fieldLabel}>ICON</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
        {EMOJIS.map((e) => (
          <TouchableOpacity
            key={e}
            style={[styles.emojiBtn, e === emoji && styles.emojiBtnSel]}
            onPress={() => onEmojiChange(e)}
          >
            <Text style={{ fontSize: 22 }}>{e}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.fieldLabel}>TYPE</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        {(['daily', 'volume'] as HabitType[]).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.typeBtn, type === t && styles.typeBtnSel]}
            onPress={() => onTypeChange(t)}
          >
            <Text style={[styles.typeBtnText, type === t && { color: PURPLE }]}>
              {t === 'daily' ? '📅 Once a day' : '🔁 Multiple times'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {type === 'volume' && (
        <View style={{ marginBottom: 20 }}>
          <Text style={styles.fieldLabel}>TIMES PER DAY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onTargetChange(Math.max(2, target - 1))}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#1A1A1A' }}>{target}</Text>
            <TouchableOpacity style={styles.stepBtn} onPress={() => onTargetChange(Math.min(10, target + 1))}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, !name.trim() && { backgroundColor: '#CCC' }]}
        onPress={onNext}
        disabled={!name.trim()}
        activeOpacity={0.85}
      >
        <Text style={styles.primaryBtnText}>Add Habit →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function StepChallenge({ habit, onAccept, onSkip }: { habit: Habit; onAccept: () => void; onSkip: () => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.bigEmoji}>🎯</Text>
      <Text style={styles.heading}>3-Day Challenge</Text>
      <Text style={styles.subheading}>
        Start strong — complete{' '}
        <Text style={{ fontWeight: '700', color: '#1A1A1A' }}>{habit.emoji} {habit.name}</Text>
        {' '}for 3 days in a row.
      </Text>

      <View style={styles.dayDots}>
        {[1, 2, 3].map((d) => (
          <View key={d} style={styles.dayDot}>
            <View style={[styles.dot, d === 1 && { backgroundColor: PURPLE }]} />
            <Text style={styles.dayLabel}>Day {d}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onAccept} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Start Challenge 🚀</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={onSkip}>
        <Text style={styles.ghostBtnText}>Maybe later</Text>
      </TouchableOpacity>
    </View>
  );
}

function StepNotifications({ onEnable, onSkip }: { onEnable: () => void; onSkip: () => void }) {
  return (
    <View style={styles.step}>
      <Text style={styles.bigEmoji}>🔔</Text>
      <Text style={styles.heading}>Stay on track</Text>
      <Text style={styles.subheading}>
        Get gentle daily reminders so your habits never slip through the cracks.
      </Text>
      <TouchableOpacity style={styles.primaryBtn} onPress={onEnable} activeOpacity={0.85}>
        <Text style={styles.primaryBtnText}>Enable Reminders</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.ghostBtn} onPress={onSkip}>
        <Text style={styles.ghostBtnText}>Skip for now</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  container: { flex: 1 },
  step: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: 60,
    paddingBottom: 40,
  },
  bigEmoji: { fontSize: 72, marginBottom: 24, textAlign: 'center' },
  heading: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 14,
    lineHeight: 40,
  },
  subheading: {
    fontSize: 17,
    color: '#666',
    lineHeight: 26,
    marginBottom: 36,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 20,
    backgroundColor: '#FFF',
  },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnSel: { backgroundColor: '#EEE9FF', borderWidth: 2, borderColor: PURPLE },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeBtnSel: { backgroundColor: '#EEE9FF', borderColor: PURPLE },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#888' },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EEE9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: PURPLE, fontWeight: '700', lineHeight: 26 },
  dayDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 40,
  },
  dayDot: { alignItems: 'center', gap: 8 },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DDD',
  },
  dayLabel: { fontSize: 12, color: '#999', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 17 },
  ghostBtn: { padding: 14, alignItems: 'center' },
  ghostBtnText: { color: '#999', fontSize: 15, fontWeight: '600' },
});

import { useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { AddHabitModal } from '../components/AddHabitModal';
import { HabitRow } from '../components/HabitRow';
import { ProgressRing } from '../components/ProgressRing';
import { hapticAllDone, hapticChallengeComplete } from '../rewards';
import { Habit } from '../types';
import {
  computeChallengeStatus,
  countForDate,
  getGreeting,
  isCompletedToday,
  todayStr,
} from '../utils';

const PURPLE = '#6C47FF';

export function TodayScreen() {
  const { habits, updateHabits, challenges, updateChallenges } = useApp();
  const [addVisible, setAddVisible] = useState(false);
  const [rewardId, setRewardId] = useState<string | null>(null);
  const [allDoneBanner, setAllDoneBanner] = useState(false);
  const [celebrateChallenge, setCelebrateChallenge] = useState<string | null>(null);
  const bannerAnim = useRef(new Animated.Value(0)).current;
  const fabScale = useRef(new Animated.Value(1)).current;

  const today = todayStr();
  const doneCount = habits.filter(isCompletedToday).length;
  const total = habits.length;
  const progress = total > 0 ? doneCount / total : 0;

  const dateLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  function showBanner() {
    setAllDoneBanner(true);
    Animated.sequence([
      Animated.timing(bannerAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(bannerAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setAllDoneBanner(false));
  }

  function checkChallengeCompletion(newHabits: Habit[]) {
    for (const ch of challenges) {
      if (ch.status !== 'active') continue;
      const h = newHabits.find((hb) => hb.id === ch.habitId);
      if (!h) continue;
      const newStatus = computeChallengeStatus(ch, h);
      if (newStatus !== 'active') {
        const updated = challenges.map((c) =>
          c.id === ch.id ? { ...c, status: newStatus } : c
        );
        updateChallenges(updated);
        if (newStatus === 'completed') {
          hapticChallengeComplete();
          setCelebrateChallenge(ch.title);
          setTimeout(() => setCelebrateChallenge(null), 4000);
        }
      }
    }
  }

  function toggleHabit(id: string) {
    const today = todayStr();
    const newHabits = habits.map((h) => {
      if (h.id !== id) return h;
      const isDone = isCompletedToday(h);
      if (isDone) {
        return { ...h, completions: h.completions.filter((c) => c.date !== today) };
      }
      return {
        ...h,
        completions: [...h.completions.filter((c) => c.date !== today), { date: today, count: 1 }],
      };
    });
    updateHabits(newHabits);

    const wasAlreadyDone = isCompletedToday(habits.find((h) => h.id === id)!);
    if (!wasAlreadyDone) {
      setRewardId(id);
      setTimeout(() => setRewardId(null), 700);
      const nowDone = newHabits.filter(isCompletedToday).length;
      if (nowDone === newHabits.length && newHabits.length > 0) {
        hapticAllDone();
        showBanner();
      }
    }
    checkChallengeCompletion(newHabits);
  }

  function incrementVolume(id: string) {
    const today = todayStr();
    const habit = habits.find((h) => h.id === id)!;
    const current = countForDate(habit, today);
    if (current >= habit.targetCount) return;
    const newCount = current + 1;
    const newHabits = habits.map((h) => {
      if (h.id !== id) return h;
      return {
        ...h,
        completions: [...h.completions.filter((c) => c.date !== today), { date: today, count: newCount }],
      };
    });
    updateHabits(newHabits);
    if (newCount >= habit.targetCount) {
      setRewardId(id);
      setTimeout(() => setRewardId(null), 700);
      const nowDone = newHabits.filter(isCompletedToday).length;
      if (nowDone === newHabits.length) {
        hapticAllDone();
        showBanner();
      }
    }
    checkChallengeCompletion(newHabits);
  }

  function decrementVolume(id: string) {
    const today = todayStr();
    const habit = habits.find((h) => h.id === id)!;
    const current = countForDate(habit, today);
    if (current <= 0) return;
    const newHabits = habits.map((h) => {
      if (h.id !== id) return h;
      return {
        ...h,
        completions: [...h.completions.filter((c) => c.date !== today), { date: today, count: current - 1 }],
      };
    });
    updateHabits(newHabits);
  }

  function deleteHabit(id: string) {
    Alert.alert('Delete habit?', 'This removes the habit and all its history.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => updateHabits(habits.filter((h) => h.id !== id)) },
    ]);
  }

  function addHabit(habit: Habit) {
    updateHabits([...habits, habit]);
  }

  function pressFab() {
    Animated.sequence([
      Animated.timing(fabScale, { toValue: 0.88, duration: 80, useNativeDriver: true }),
      Animated.spring(fabScale, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
    setAddVisible(true);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Challenge celebration banner */}
      {celebrateChallenge && (
        <View style={styles.challengeBanner}>
          <Text style={styles.challengeBannerText}>🏆 Challenge complete: {celebrateChallenge}!</Text>
        </View>
      )}

      {/* All-done banner */}
      {allDoneBanner && (
        <Animated.View style={[styles.allDoneBanner, { opacity: bannerAnim }]}>
          <Text style={styles.allDoneText}>🎉 All done for today!</Text>
        </Animated.View>
      )}

      <FlatList
        data={habits}
        keyExtractor={(h) => h.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <Text style={styles.dateText}>{dateLabel}</Text>
              <Text style={styles.greeting}>{getGreeting()} 👋</Text>
            </View>

            {total > 0 && (
              <View style={styles.ringWrap}>
                <ProgressRing
                  progress={progress}
                  color={PURPLE}
                  label={`${doneCount}/${total}`}
                  sublabel={progress === 1 ? 'All done! 🎉' : 'habits done'}
                />
              </View>
            )}

            {habits.length > 0 && <View style={styles.divider} />}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌱</Text>
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>Tap + to add your first habit</Text>
          </View>
        }
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            onToggle={() => toggleHabit(item.id)}
            onIncrement={() => incrementVolume(item.id)}
            onDecrement={() => decrementVolume(item.id)}
            onDelete={() => deleteHabit(item.id)}
            rewardVisible={rewardId === item.id}
          />
        )}
      />

      <Animated.View style={[styles.fabWrap, { transform: [{ scale: fabScale }] }]}>
        <TouchableOpacity style={styles.fab} onPress={pressFab} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </Animated.View>

      <AddHabitModal
        visible={addVisible}
        habitCount={habits.length}
        onAdd={addHabit}
        onClose={() => setAddVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 8 },
  dateText: { fontSize: 13, color: '#888', fontWeight: '500', marginBottom: 4 },
  greeting: { fontSize: 26, fontWeight: '800', color: '#1A1A1A' },
  ringWrap: { alignItems: 'center', paddingVertical: 28 },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginHorizontal: 24, marginBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 110 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyEmoji: { fontSize: 60, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySub: { fontSize: 15, color: '#888' },
  fabWrap: {
    position: 'absolute',
    bottom: 32,
    right: 24,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fabText: { fontSize: 32, color: '#FFF', lineHeight: 36, marginTop: -2 },
  allDoneBanner: {
    position: 'absolute',
    top: 100,
    left: 24,
    right: 24,
    zIndex: 100,
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: PURPLE,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  allDoneText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  challengeBanner: {
    backgroundColor: '#FFFBE6',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE082',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  challengeBannerText: { color: '#B8860B', fontWeight: '700', fontSize: 14 },
});

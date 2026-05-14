import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { Challenge } from '../types';
import { computeChallengeStatus, getChallengeDays, todayStr } from '../utils';

const PURPLE = '#6C47FF';

export function ChallengesScreen() {
  const { habits, challenges, updateChallenges } = useApp();
  const [newChallengeModal, setNewChallengeModal] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState(3);

  const active = challenges.filter((c) => c.status === 'active');
  const completed = challenges.filter((c) => c.status === 'completed');
  const failed = challenges.filter((c) => c.status === 'failed');

  function startChallenge() {
    if (!selectedHabitId) return;
    const habit = habits.find((h) => h.id === selectedHabitId);
    if (!habit) return;
    const ch: Challenge = {
      id: Date.now().toString(),
      title: `${selectedDays}-Day Challenge`,
      habitId: selectedHabitId,
      durationDays: selectedDays,
      startDate: todayStr(),
      status: 'active',
    };
    updateChallenges([...challenges, ch]);
    setNewChallengeModal(false);
    setSelectedHabitId(null);
    setSelectedDays(3);
  }

  function deleteChallenge(id: string) {
    Alert.alert('Remove challenge?', undefined, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => updateChallenges(challenges.filter((c) => c.id !== id)) },
    ]);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Challenges</Text>
          {habits.length > 0 && (
            <TouchableOpacity style={styles.newBtn} onPress={() => setNewChallengeModal(true)}>
              <Text style={styles.newBtnText}>+ New</Text>
            </TouchableOpacity>
          )}
        </View>

        {challenges.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🎯</Text>
            <Text style={styles.emptyTitle}>No challenges yet</Text>
            <Text style={styles.emptySub}>
              {habits.length === 0
                ? 'Add a habit first, then start a challenge'
                : 'Tap "+ New" to start your first challenge'}
            </Text>
          </View>
        )}

        {active.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>ACTIVE</Text>
            {active.map((ch) => {
              const habit = habits.find((h) => h.id === ch.habitId);
              if (!habit) return null;
              const days = getChallengeDays(ch, habit);
              const doneCount = days.filter((d) => d.status === 'done').length;
              const todayIdx = days.findIndex((d) => d.status === 'today');
              return (
                <View key={ch.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardTitle}>{ch.title}</Text>
                      <Text style={styles.cardHabit}>{habit.emoji} {habit.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => deleteChallenge(ch.id)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                      <Text style={styles.cardDel}>×</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.dayRow}>
                    {days.map((d, i) => (
                      <View key={i} style={styles.dayCol}>
                        <View style={[
                          styles.dayCircle,
                          d.status === 'done' && { backgroundColor: habit.color },
                          d.status === 'today' && { borderColor: habit.color, borderWidth: 2 },
                          d.status === 'missed' && { backgroundColor: '#FFE0E0' },
                        ]}>
                          <Text style={styles.dayCircleText}>
                            {d.status === 'done' ? '✓' : d.status === 'missed' ? '✗' : String(i + 1)}
                          </Text>
                        </View>
                        <Text style={styles.dayNum}>Day {i + 1}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.cardStatus}>
                    {doneCount === 0
                      ? 'Day 1 — let\'s go! 💪'
                      : todayIdx >= 0
                      ? `Day ${todayIdx + 1} of ${ch.durationDays} — keep it up!`
                      : `${doneCount}/${ch.durationDays} days done`}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {completed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>COMPLETED 🏆</Text>
            {completed.map((ch) => {
              const habit = habits.find((h) => h.id === ch.habitId);
              return (
                <View key={ch.id} style={[styles.card, styles.cardDone]}>
                  <Text style={styles.cardDoneEmoji}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{ch.title}</Text>
                    {habit && <Text style={styles.cardHabit}>{habit.emoji} {habit.name}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => deleteChallenge(ch.id)} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                    <Text style={styles.cardDel}>×</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        {failed.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>INCOMPLETE</Text>
            {failed.map((ch) => {
              const habit = habits.find((h) => h.id === ch.habitId);
              return (
                <View key={ch.id} style={[styles.card, styles.cardFailed]}>
                  <Text style={styles.cardTitle}>{ch.title}</Text>
                  {habit && <Text style={styles.cardHabit}>{habit.emoji} {habit.name}</Text>}
                  <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => {
                      if (!habit) return;
                      updateChallenges([
                        ...challenges.filter((c) => c.id !== ch.id),
                        {
                          ...ch,
                          id: Date.now().toString(),
                          startDate: todayStr(),
                          status: 'active',
                        },
                      ]);
                    }}
                  >
                    <Text style={styles.retryBtnText}>Retry →</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* New Challenge Modal */}
      <Modal visible={newChallengeModal} animationType="slide" transparent>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setNewChallengeModal(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>New Challenge</Text>

          <Text style={styles.modalLabel}>HABIT</Text>
          <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
            {habits.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[styles.habitOption, selectedHabitId === h.id && { borderColor: h.color, backgroundColor: h.color + '15' }]}
                onPress={() => setSelectedHabitId(h.id)}
              >
                <Text style={styles.habitOptionText}>{h.emoji} {h.name}</Text>
                {selectedHabitId === h.id && <Text style={{ color: h.color, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={[styles.modalLabel, { marginTop: 16 }]}>DURATION</Text>
          <View style={styles.daysRow}>
            {[3, 7, 21].map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dayOption, selectedDays === d && styles.dayOptionActive]}
                onPress={() => setSelectedDays(d)}
              >
                <Text style={[styles.dayOptionText, selectedDays === d && { color: PURPLE }]}>
                  {d} days
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.startBtn, !selectedHabitId && { backgroundColor: '#CCC' }]}
            onPress={startChallenge}
            disabled={!selectedHabitId}
          >
            <Text style={styles.startBtnText}>Start Challenge 🚀</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  newBtn: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  newBtnText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  section: { paddingHorizontal: 16, marginBottom: 12 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8, marginBottom: 10, paddingHorizontal: 4 },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDone: { backgroundColor: '#FFFBE6', borderColor: '#FFE082', flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardFailed: { backgroundColor: '#FFF5F5', borderColor: '#FFCDD2' },
  cardDoneEmoji: { fontSize: 28 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#1A1A1A', marginBottom: 2 },
  cardHabit: { fontSize: 14, color: '#666', fontWeight: '500' },
  cardDel: { fontSize: 22, color: '#CCC', lineHeight: 26 },
  dayRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  dayCol: { alignItems: 'center', gap: 6 },
  dayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleText: { fontSize: 13, fontWeight: '700', color: '#FFF' },
  dayNum: { fontSize: 10, color: '#999', fontWeight: '600' },
  cardStatus: { fontSize: 13, color: '#888', fontWeight: '500' },
  retryBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  empty: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 32 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySub: { fontSize: 15, color: '#888', textAlign: 'center' },
  modalSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 44,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 20,
  },
  modalHandle: { width: 40, height: 4, backgroundColor: '#DDD', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },
  modalLabel: { fontSize: 11, fontWeight: '700', color: '#999', letterSpacing: 0.8, marginBottom: 8 },
  habitOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  habitOptionText: { fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  daysRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  dayOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dayOptionActive: { backgroundColor: '#EEE9FF', borderColor: PURPLE },
  dayOptionText: { fontSize: 14, fontWeight: '700', color: '#888' },
  startBtn: { backgroundColor: PURPLE, borderRadius: 16, padding: 16, alignItems: 'center' },
  startBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
});

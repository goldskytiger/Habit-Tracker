import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { useAuth } from '../auth/AuthContext';
import { calcStreak, last7Days, shortDayLabel, todayStr } from '../utils';

const PURPLE = '#6C47FF';

export function StatsScreen() {
  const { habits } = useApp();
  const { signOut, user } = useAuth();

  function handleSignOut() {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (habits.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySub}>Start tracking habits to see your stats</Text>
        </View>
      </SafeAreaView>
    );
  }

  const week = last7Days();
  const today = todayStr();

  const totalCompletions = habits.reduce(
    (sum, h) => sum + h.completions.filter((c) => c.count >= h.targetCount).length,
    0
  );

  const bestStreak = Math.max(...habits.map(calcStreak), 0);

  const last30 = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  });

  const totalPossible = habits.length * last30.filter((d) => d <= today).length;
  const totalDone = habits.reduce(
    (sum, h) => sum + h.completions.filter((c) => c.count >= h.targetCount && last30.includes(c.date)).length,
    0
  );
  const consistency = totalPossible > 0 ? Math.round((totalDone / totalPossible) * 100) : 0;

  const weekStats = week.map((date) => {
    const done = habits.filter((h) => {
      const c = h.completions.find((c) => c.date === date);
      return !!c && c.count >= h.targetCount;
    }).length;
    return { date, done, total: habits.length };
  });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Progress</Text>
        </View>

        {/* Summary cards */}
        <View style={styles.cards}>
          <View style={[styles.card, { backgroundColor: '#FFF5F5' }]}>
            <Text style={styles.cardEmoji}>🔥</Text>
            <Text style={styles.cardValue}>{bestStreak}</Text>
            <Text style={styles.cardLabel}>Best streak</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#F0EDFF' }]}>
            <Text style={styles.cardEmoji}>✅</Text>
            <Text style={styles.cardValue}>{totalCompletions}</Text>
            <Text style={styles.cardLabel}>Total done</Text>
          </View>
          <View style={[styles.card, { backgroundColor: '#F0FFF4' }]}>
            <Text style={styles.cardEmoji}>📈</Text>
            <Text style={styles.cardValue}>{consistency}%</Text>
            <Text style={styles.cardLabel}>Consistency</Text>
          </View>
        </View>

        {/* Weekly bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last 7 Days</Text>
          <View style={styles.barChart}>
            {weekStats.map(({ date, done, total }) => {
              const pct = total > 0 ? done / total : 0;
              const isToday = date === today;
              return (
                <View key={date} style={styles.barCol}>
                  <View style={styles.barTrack}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          height: `${Math.max(pct * 100, pct > 0 ? 8 : 0)}%`,
                          backgroundColor: isToday ? PURPLE : pct === 1 ? '#4ECDC4' : pct > 0 ? '#A08BE8' : '#E8E8E8',
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: PURPLE, fontWeight: '700' }]}>
                    {shortDayLabel(date)}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Per-habit breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Per Habit</Text>
          {habits.map((h) => {
            const streak = calcStreak(h);
            const weekDone = week.filter((d) => {
              const c = h.completions.find((c) => c.date === d);
              return !!c && c.count >= h.targetCount;
            }).length;
            const pct = Math.round((weekDone / 7) * 100);
            return (
              <View key={h.id} style={styles.habitStat}>
                <View style={styles.habitStatTop}>
                  <Text style={styles.habitStatEmoji}>{h.emoji}</Text>
                  <Text style={styles.habitStatName} numberOfLines={1}>{h.name}</Text>
                  <Text style={styles.habitStatPct}>{pct}%</Text>
                </View>
                <View style={styles.barTrackFlat}>
                  <View
                    style={[
                      styles.barFillFlat,
                      { width: `${pct}%` as any, backgroundColor: h.color },
                    ]}
                  />
                </View>
                <View style={styles.habitStatBottom}>
                  <Text style={styles.habitStatSub}>{weekDone}/7 days this week</Text>
                  {streak > 0 && <Text style={styles.habitStatStreak}>🔥 {streak} streak</Text>}
                </View>
              </View>
            );
          })}
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.accountEmail}>{user?.email}</Text>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  cards: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    gap: 4,
  },
  cardEmoji: { fontSize: 24 },
  cardValue: { fontSize: 24, fontWeight: '800', color: '#1A1A1A' },
  cardLabel: { fontSize: 11, fontWeight: '600', color: '#888', textAlign: 'center' },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', marginBottom: 14 },
  barChart: { flexDirection: 'row', gap: 6, height: 120, alignItems: 'flex-end' },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barTrack: {
    flex: 1,
    width: '100%',
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: { width: '100%', borderRadius: 6 },
  barLabel: { fontSize: 11, color: '#999', fontWeight: '600' },
  habitStat: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  habitStatTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  habitStatEmoji: { fontSize: 20, marginRight: 8 },
  habitStatName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  habitStatPct: { fontSize: 15, fontWeight: '700', color: '#555' },
  barTrackFlat: {
    height: 7,
    backgroundColor: '#F0F0F0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFillFlat: { height: '100%', borderRadius: 4 },
  habitStatBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  habitStatSub: { fontSize: 12, color: '#999' },
  habitStatStreak: { fontSize: 12, fontWeight: '600', color: '#E65100' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySub: { fontSize: 15, color: '#888' },
  accountEmail: { fontSize: 13, color: '#AAA', textAlign: 'center', marginBottom: 12 },
  signOutBtn: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  signOutText: { fontSize: 15, fontWeight: '600', color: '#888' },
});

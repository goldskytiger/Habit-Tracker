import { SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '../AppContext';
import { countForDate, friendlyDate, isCompletedToday, last30Days, todayStr } from '../utils';

export function LogScreen() {
  const { habits } = useApp();

  const days = last30Days();

  const sections = days
    .map((date) => {
      const entries = habits.map((h) => {
        const count = countForDate(h, date);
        const done = count >= h.targetCount;
        return { habit: h, count, done };
      });
      const anyActivity = entries.some((e) => e.count > 0);
      return { date, entries, anyActivity };
    })
    .filter((s) => s.anyActivity || s.date === todayStr());

  if (sections.length === 0) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>Activity Log</Text>
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>📖</Text>
          <Text style={styles.emptyTitle}>Nothing logged yet</Text>
          <Text style={styles.emptySub}>Start checking off habits to see your history</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SectionList
        sections={sections.map((s) => ({
          title: s.date,
          data: s.entries,
        }))}
        keyExtractor={(item, index) => item.habit.id + index}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Activity Log</Text>
          </View>
        }
        renderSectionHeader={({ section }) => {
          const total = section.data.length;
          const done = section.data.filter((e) => e.done).length;
          const pct = total > 0 ? Math.round((done / total) * 100) : 0;
          return (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionDate}>{friendlyDate(section.title)}</Text>
              <View style={styles.sectionBadge}>
                <Text style={styles.sectionPct}>{pct}%</Text>
              </View>
            </View>
          );
        }}
        renderItem={({ item }) => (
          <View style={[styles.logRow, !item.done && styles.logRowMissed]}>
            <View style={[styles.logAccent, { backgroundColor: item.done ? item.habit.color : '#DDD' }]} />
            <Text style={styles.logEmoji}>{item.habit.emoji}</Text>
            <Text style={[styles.logName, !item.done && styles.logNameMissed]}>{item.habit.name}</Text>
            <View style={styles.logRight}>
              {item.habit.type === 'volume' ? (
                <Text style={[styles.logCount, item.done && { color: item.habit.color }]}>
                  {item.count}/{item.habit.targetCount}
                </Text>
              ) : (
                <Text style={[styles.logCheck, item.done && { color: item.habit.color }]}>
                  {item.done ? '✓' : '○'}
                </Text>
              )}
            </View>
          </View>
        )}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1A1A1A' },
  list: { paddingHorizontal: 16, paddingBottom: 40 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionDate: { fontSize: 15, fontWeight: '700', color: '#555' },
  sectionBadge: {
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sectionPct: { fontSize: 12, fontWeight: '700', color: '#888' },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 14,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
  },
  logRowMissed: { opacity: 0.55 },
  logAccent: { width: 4, alignSelf: 'stretch' },
  logEmoji: { fontSize: 20, paddingHorizontal: 12, paddingVertical: 14 },
  logName: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A1A' },
  logNameMissed: { color: '#999' },
  logRight: { paddingRight: 16 },
  logCount: { fontSize: 14, fontWeight: '700', color: '#888' },
  logCheck: { fontSize: 18, fontWeight: '700', color: '#CCC' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  emptyEmoji: { fontSize: 56, marginBottom: 12 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 6 },
  emptySub: { fontSize: 15, color: '#888', textAlign: 'center', paddingHorizontal: 32 },
});

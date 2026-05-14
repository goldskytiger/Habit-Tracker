import { useRef, useState } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { hapticComplete, hapticTap, hapticUndo } from '../rewards';
import { Habit } from '../types';
import { calcStreak, countForDate, isCompletedToday, todayStr } from '../utils';
import { RewardBurst } from './RewardBurst';

type Props = {
  habit: Habit;
  onToggle: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
  onDelete: () => void;
  rewardVisible: boolean;
};

export function HabitRow({ habit, onToggle, onIncrement, onDecrement, onDelete, rewardVisible }: Props) {
  const done = isCompletedToday(habit);
  const streak = calcStreak(habit);
  const today = todayStr();
  const count = countForDate(habit, today);
  const scale = useRef(new Animated.Value(1)).current;

  function bounce() {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.94, duration: 70, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 4, tension: 200 }),
    ]).start();
  }

  function handleToggle() {
    bounce();
    if (done) hapticUndo(); else hapticComplete();
    onToggle();
  }

  function handleIncrement() {
    bounce();
    onIncrement();
  }

  function handleDecrement() {
    hapticTap();
    onDecrement();
  }

  return (
    <Animated.View
      style={[
        styles.row,
        done && { backgroundColor: habit.color + '15', borderColor: habit.color + '40' },
        { transform: [{ scale }] },
      ]}
    >
      <View style={[styles.accent, { backgroundColor: habit.color }]} />

      {habit.type === 'daily' ? (
        <TouchableOpacity style={styles.checkArea} onPress={handleToggle} activeOpacity={0.75}>
          <View style={[styles.checkbox, { borderColor: habit.color }, done && { backgroundColor: habit.color }]}>
            {done && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.volumeArea}>
          <TouchableOpacity style={styles.volBtn} onPress={handleDecrement} activeOpacity={0.7}>
            <Text style={[styles.volBtnText, { color: habit.color }]}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleIncrement} activeOpacity={0.7} style={styles.countPill}>
            <Text style={[styles.countText, { color: done ? habit.color : '#555' }]}>
              {count}/{habit.targetCount}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.volBtn} onPress={handleIncrement} activeOpacity={0.7}>
            <Text style={[styles.volBtnText, { color: habit.color }]}>+</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
        <Text style={[styles.name, done && { color: habit.color }]} numberOfLines={1}>
          {habit.name}
        </Text>
      </View>

      <View style={styles.meta}>
        {streak > 0 && (
          <View style={styles.streak}>
            <Text style={styles.streakText}>🔥 {streak}</Text>
          </View>
        )}
        <TouchableOpacity onPress={onDelete} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
          <Text style={styles.del}>×</Text>
        </TouchableOpacity>
      </View>

      <RewardBurst color={habit.color} visible={rewardVisible} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  accent: {
    width: 5,
    alignSelf: 'stretch',
  },
  checkArea: {
    paddingHorizontal: 14,
    paddingVertical: 18,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '900',
  },
  volumeArea: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 4,
    gap: 4,
  },
  volBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  volBtnText: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  countPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    minWidth: 36,
    alignItems: 'center',
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
  },
  emoji: { fontSize: 22 },
  name: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 14,
  },
  streak: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  streakText: { fontSize: 12, fontWeight: '700', color: '#E65100' },
  del: { fontSize: 22, color: '#CCC', lineHeight: 26 },
});

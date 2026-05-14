import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { EMOJIS, HABIT_COLORS, Habit, HabitType } from '../types';
import { todayStr } from '../utils';

type Props = {
  visible: boolean;
  habitCount: number;
  onAdd: (habit: Habit) => void;
  onClose: () => void;
};

const PURPLE = '#6C47FF';

export function AddHabitModal({ visible, habitCount, onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [type, setType] = useState<HabitType>('daily');
  const [target, setTarget] = useState(3);
  const inputRef = useRef<TextInput>(null);

  function reset() {
    setName('');
    setEmoji(EMOJIS[0]);
    setType('daily');
    setTarget(3);
  }

  function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const habit: Habit = {
      id: Date.now().toString(),
      name: trimmed,
      emoji,
      type,
      targetCount: type === 'daily' ? 1 : target,
      completions: [],
      createdAt: todayStr(),
      color: HABIT_COLORS[habitCount % HABIT_COLORS.length],
    };
    onAdd(habit);
    reset();
    onClose();
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onShow={() => inputRef.current?.focus()}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>New Habit</Text>

          <Text style={styles.label}>NAME</Text>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="e.g. Drink 8 glasses of water"
            placeholderTextColor="#BBB"
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={handleAdd}
            maxLength={40}
          />

          <Text style={styles.label}>ICON</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.emojiRow}
          >
            {EMOJIS.map((e) => (
              <TouchableOpacity
                key={e}
                style={[styles.emojiBtn, e === emoji && styles.emojiBtnSelected]}
                onPress={() => setEmoji(e)}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.label}>TYPE</Text>
          <View style={styles.typeRow}>
            {(['daily', 'volume'] as HabitType[]).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.typeBtn, type === t && styles.typeBtnActive]}
                onPress={() => setType(t)}
              >
                <Text style={[styles.typeBtnText, type === t && styles.typeBtnTextActive]}>
                  {t === 'daily' ? '📅 Once a day' : '🔁 Multiple times'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {type === 'volume' && (
            <View style={styles.targetRow}>
              <Text style={styles.label}>TIMES PER DAY</Text>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setTarget(Math.max(2, target - 1))}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepValue}>{target}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setTarget(Math.min(10, target + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
            onPress={handleAdd}
            disabled={!name.trim()}
            activeOpacity={0.85}
          >
            <Text style={styles.addBtnText}>Add Habit</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
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
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#DDD',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 20 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    color: '#1A1A1A',
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  emojiRow: { gap: 8, paddingBottom: 16 },
  emojiBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiBtnSelected: {
    backgroundColor: '#EEE9FF',
    borderWidth: 2,
    borderColor: PURPLE,
  },
  emojiText: { fontSize: 22 },
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeBtnActive: { backgroundColor: '#EEE9FF', borderColor: PURPLE },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#888' },
  typeBtnTextActive: { color: PURPLE },
  targetRow: { marginBottom: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0EDFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: { fontSize: 22, color: PURPLE, fontWeight: '700', lineHeight: 26 },
  stepValue: { fontSize: 24, fontWeight: '800', color: '#1A1A1A', minWidth: 32, textAlign: 'center' },
  addBtn: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  addBtnDisabled: { backgroundColor: '#CCC' },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 17 },
});

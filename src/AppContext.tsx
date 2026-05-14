import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { loadChallenges, loadHabits, saveChallenges, saveHabits } from './storage';
import {
  diffChallenges,
  diffHabits,
  fetchAllData,
  pushAddedChallenges,
  pushAddedHabits,
  pushChallengeStatusChanges,
  pushDeletedChallenges,
  pushDeletedHabits,
  syncHabitCompletions,
} from './sync';
import { Challenge, Habit } from './types';
import { computeChallengeStatus } from './utils';

type AppContextType = {
  habits: Habit[];
  challenges: Challenge[];
  updateHabits: (habits: Habit[]) => void;
  updateChallenges: (challenges: Challenge[]) => void;
  loaded: boolean;
  syncing: boolean;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children, userId }: { children: React.ReactNode; userId: string }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Refs for diffing without stale closures
  const habitsRef = useRef<Habit[]>([]);
  const challengesRef = useRef<Challenge[]>([]);

  useEffect(() => {
    setLoaded(false);
    setHabits([]);
    setChallenges([]);
    habitsRef.current = [];
    challengesRef.current = [];

    // 1. Paint from cache immediately — zero network wait
    Promise.all([loadHabits(userId), loadChallenges(userId)]).then(([h, c]) => {
      const synced = reconcileStatuses(h, c);
      setHabits(h);
      habitsRef.current = h;
      setChallenges(synced);
      challengesRef.current = synced;
      setLoaded(true);
    });

    // 2. Reconcile with Supabase in the background
    setSyncing(true);
    fetchAllData(userId)
      .then(({ habits: h, challenges: c }) => {
        const synced = reconcileStatuses(h, c);
        setHabits(h);
        habitsRef.current = h;
        setChallenges(synced);
        challengesRef.current = synced;
        saveHabits(h, userId);
        saveChallenges(synced, userId);
        setLoaded(true);
      })
      .catch(() => {
        // Offline — cached view is already rendered, nothing to do
      })
      .finally(() => setSyncing(false));
  }, [userId]);

  function reconcileStatuses(h: Habit[], c: Challenge[]): Challenge[] {
    return c.map((ch) => {
      if (ch.status !== 'active') return ch;
      const habit = h.find((hb) => hb.id === ch.habitId);
      if (!habit) return ch;
      const status = computeChallengeStatus(ch, habit);
      return status !== 'active' ? { ...ch, status } : ch;
    });
  }

  function updateHabits(next: Habit[]) {
    const prev = habitsRef.current;
    setHabits(next);
    habitsRef.current = next;
    saveHabits(next, userId); // instant local cache

    // Push diff to Supabase in background
    const { added, deleted, completionChanged } = diffHabits(prev, next);
    Promise.all([
      pushAddedHabits(added, userId),
      pushDeletedHabits(deleted),
      ...completionChanged.map((h) => syncHabitCompletions(h, userId)),
    ]).catch(console.warn);
  }

  function updateChallenges(next: Challenge[]) {
    const prev = challengesRef.current;
    setChallenges(next);
    challengesRef.current = next;
    saveChallenges(next, userId); // instant local cache

    const { added, deleted, statusChanged } = diffChallenges(prev, next);
    Promise.all([
      pushAddedChallenges(added, userId),
      pushDeletedChallenges(deleted),
      pushChallengeStatusChanges(statusChanged),
    ]).catch(console.warn);
  }

  return (
    <AppContext.Provider value={{ habits, challenges, updateHabits, updateChallenges, loaded, syncing }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

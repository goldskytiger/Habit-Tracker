import { createContext, useContext, useEffect, useState } from 'react';
import { loadChallenges, loadHabits, saveChallenges, saveHabits } from './storage';
import { Challenge, Habit } from './types';
import { computeChallengeStatus } from './utils';

type AppContextType = {
  habits: Habit[];
  challenges: Challenge[];
  updateHabits: (habits: Habit[]) => void;
  updateChallenges: (challenges: Challenge[]) => void;
  loaded: boolean;
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([loadHabits(), loadChallenges()]).then(([h, c]) => {
      setHabits(h);
      // Sync any challenges whose status has drifted (e.g. app opened after missing a day)
      const synced = c.map((ch) => {
        if (ch.status !== 'active') return ch;
        const habit = h.find((hb) => hb.id === ch.habitId);
        if (!habit) return ch;
        const status = computeChallengeStatus(ch, habit);
        return status !== 'active' ? { ...ch, status } : ch;
      });
      setChallenges(synced);
      if (synced.some((ch, i) => ch.status !== c[i].status)) {
        saveChallenges(synced);
      }
      setLoaded(true);
    });
  }, []);

  function updateHabits(h: Habit[]) {
    setHabits(h);
    saveHabits(h);
  }

  function updateChallenges(c: Challenge[]) {
    setChallenges(c);
    saveChallenges(c);
  }

  return (
    <AppContext.Provider value={{ habits, challenges, updateHabits, updateChallenges, loaded }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

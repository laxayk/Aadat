import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeChoice = 'light' | 'dark' | 'system';

export interface Palette {
  bg: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textMuted: string;
  accent: string;
  accentText: string;
  done: string;
  border: string;
  danger: string;
}

export const lightPalette: Palette = {
  bg: '#F5F6FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EBEDF7',
  text: '#191B28',
  textMuted: '#696D80',
  accent: '#4A54C4',
  accentText: '#FFFFFF',
  done: '#2E9E5B',
  border: '#DEE1EE',
  danger: '#C44A4A',
};

export const darkPalette: Palette = {
  bg: '#14161F',
  surface: '#1E2130',
  surfaceAlt: '#282C3E',
  text: '#F2F3F8',
  textMuted: '#9BA0B5',
  accent: '#8F98FF',
  accentText: '#14161F',
  done: '#4CC47C',
  border: '#31364B',
  danger: '#E07A7A',
};

interface ThemeState {
  choice: ThemeChoice;
  resolved: 'light' | 'dark';
  colors: Palette;
  setChoice: (c: ThemeChoice) => void;
}

const ThemeContext = createContext<ThemeState>({
  choice: 'system', resolved: 'light', colors: lightPalette, setChoice: () => {},
});

const STORAGE_KEY = 'habitcanvas.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  const [choice, setChoiceState] = useState<ThemeChoice>('system');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'light' || v === 'dark' || v === 'system') setChoiceState(v);
    });
  }, []);

  const setChoice = (c: ThemeChoice) => {
    setChoiceState(c);
    AsyncStorage.setItem(STORAGE_KEY, c);
  };

  const resolved = choice === 'system' ? system : choice;
  const colors = resolved === 'dark' ? darkPalette : lightPalette;
  const value = useMemo(() => ({ choice, resolved, colors, setChoice }), [choice, resolved]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

/** The four habit colours from the design plan. */
export const HABIT_COLORS = ['#2E9E5B', '#E8913A', '#4A54C4', '#C44A8A'];

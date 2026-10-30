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
  bg: '#FAF6F1',
  surface: '#FFFFFF',
  surfaceAlt: '#F1E9E0',
  text: '#2A1A10',
  textMuted: '#8A6F5C',
  accent: '#F2622E',
  accentText: '#FFFFFF',
  done: '#2F9E62',
  border: '#EBE3DA',
  danger: '#C43D3D',
};

export const darkPalette: Palette = {
  bg: '#1B1310',
  surface: '#2A1E19',
  surfaceAlt: '#3A2A22',
  text: '#FBEFE3',
  textMuted: '#C2A593',
  accent: '#FF8352',
  accentText: '#2A1209',
  done: '#4FC885',
  border: '#43322A',
  danger: '#F08080',
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

const STORAGE_KEY = 'aadat.theme';

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
export const HABIT_COLORS = ['#F2622E', '#E9A100', '#1F9C8F', '#B0408F'];

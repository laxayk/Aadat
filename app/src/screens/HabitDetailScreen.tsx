import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, localToday } from '../api';
import { BackHeader } from '../components/BackHeader';
import { Card, CenteredLoading, ErrorBox, Screen } from '../components/ui';
import { Text as RNText, TouchableOpacity } from 'react-native';
import { monthGrid } from '../heatmap';
import { useTheme } from '../theme';

interface Stats {
  id: string;
  name: string;
  color: string;
  currentStreak: number;
  bestStreak: number;
  doneDays: string[];
}

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function HabitDetailScreen({ route, navigation }: any) {
  const { habitId, name, color } = route.params;
  const { colors } = useTheme();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const month = localToday().slice(0, 7);

  const load = async () => {
    try {
      setStats(await api<Stats>(`/api/habits/${habitId}/stats?today=${localToday()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load stats');
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  if (!stats && !error) return <Screen><CenteredLoading /></Screen>;
  const cells = monthGrid(month, stats?.doneDays ?? []);

  return (
    <Screen>
      <BackHeader title={name} />
      {error ? <ErrorBox message={error} /> : null}
      <TouchableOpacity onPress={() => navigation.navigate('AddHabit', { habit: stats ?? { id: habitId, name, color } })}>
        <RNText style={{ color: colors.accent, fontWeight: '800', marginBottom: 14, fontSize: 15 }}>Edit habit</RNText>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 0.6 }}>CURRENT STREAK</Text>
          <Text style={{ fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1 }}>{stats?.currentStreak ?? 0}</Text>
          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{(stats?.currentStreak ?? 0) === 1 ? 'day' : 'days'}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 }}>
          <Text style={{ color: colors.textMuted, fontWeight: '700', fontSize: 12, letterSpacing: 0.6 }}>BEST STREAK</Text>
          <Text style={{ fontSize: 36, fontWeight: '800', color: colors.text, letterSpacing: -1 }}>{stats?.bestStreak ?? 0}</Text>
          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{(stats?.bestStreak ?? 0) === 1 ? 'day' : 'days'}</Text>
        </View>
      </View>
      <Card>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, marginBottom: 10 }}>{new Date(month + '-01T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {WEEKDAYS.map((d, i) => (
            <View key={`w${i}`} style={{ width: '14.28%', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{d}</Text>
            </View>
          ))}
          {cells.map((c, i) => (
            <View key={i} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 4 }}>
              {c.date ? (
                <View style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: c.done ? color : colors.surfaceAlt,
                }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: c.done ? '#FFFFFF' : colors.textMuted }}>{Number(c.date.slice(8))}</Text>
                </View>
              ) : (
                <View style={{ width: 34, height: 34 }} />
              )}
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

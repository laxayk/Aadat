import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, localToday } from '../api';
import { Card, CenteredLoading, ErrorBox, Screen, Title } from '../components/ui';
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

export default function HabitDetailScreen({ route }: any) {
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
      <Title>{name}</Title>
      {error ? <ErrorBox message={error} /> : null}
      <Card>
        <Text style={{ fontSize: 34, fontWeight: '800', color }}>{stats?.currentStreak ?? 0} days</Text>
        <Text style={{ color: colors.textMuted }}>Current streak · best {stats?.bestStreak ?? 0}</Text>
      </Card>
      <Card>
        <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 8 }}>{month}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {WEEKDAYS.map((d, i) => (
            <View key={`w${i}`} style={{ width: '14.28%', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ color: colors.textMuted, fontSize: 11 }}>{d}</Text>
            </View>
          ))}
          {cells.map((c, i) => (
            <View key={i} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 3 }}>
              {c.date ? (
                <View style={{
                  width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: c.done ? color : colors.surfaceAlt,
                }}>
                  <Text style={{ fontSize: 11, color: c.done ? '#FFFFFF' : colors.textMuted }}>{Number(c.date.slice(8))}</Text>
                </View>
              ) : (
                <View style={{ width: 26, height: 26 }} />
              )}
            </View>
          ))}
        </View>
      </Card>
    </Screen>
  );
}

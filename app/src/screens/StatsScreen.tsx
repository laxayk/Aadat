import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, localToday } from '../api';
import { Card, CenteredLoading, EmptyState, ErrorBox, Screen, Title } from '../components/ui';
import { useTheme } from '../theme';

interface Habit {
  id: string;
  name: string;
  color: string;
  currentStreak: number;
  bestStreak: number;
  doneDays: string[];
}

export default function StatsScreen() {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setHabits(await api<Habit[]>(`/api/habits?today=${localToday()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load stats');
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const weekAgo = new Date(Date.now() - 6 * 86400000);
  const weekPrefix = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekStart = weekPrefix(weekAgo);
  const doneThisWeek = (h: Habit) => h.doneDays.filter((d) => d >= weekStart).length;

  return (
    <Screen>
      <Title>Stats</Title>
      {error ? <ErrorBox message={error} /> : null}
      {habits === null ? (
        <CenteredLoading />
      ) : habits.length === 0 ? (
        <EmptyState title="Nothing to show yet" hint="Add a habit on the Today tab first." />
      ) : (
        <FlatList
          data={habits}
          keyExtractor={(h) => h.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
          renderItem={({ item }) => (
            <Card>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, flex: 1 }}>{item.name}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                <Text style={{ color: colors.textMuted }}>Current streak</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{item.currentStreak} days</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: colors.textMuted }}>Best streak</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{item.bestStreak} days</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                <Text style={{ color: colors.textMuted }}>Done this week</Text>
                <Text style={{ color: colors.text, fontWeight: '600' }}>{doneThisWeek(item)} / 7</Text>
              </View>
            </Card>
          )}
        />
      )}
    </Screen>
  );
}

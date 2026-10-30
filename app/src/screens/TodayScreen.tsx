import React, { useCallback, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { api, localToday } from '../api';
import { CenteredLoading, EmptyState, ErrorBox, Screen, Title } from '../components/ui';
import { useTheme } from '../theme';

interface Habit {
  id: string;
  name: string;
  color: string;
  doneToday: boolean;
  currentStreak: number;
  bestStreak: number;
  doneDays: string[];
}

export default function TodayScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const today = localToday();

  const load = async () => {
    try {
      setError(null);
      setHabits(await api<Habit[]>(`/api/habits?today=${today}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load habits');
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const complete = async (habit: Habit) => {
    if (habit.doneToday) return;
    // Optimistic: flip the row now, roll back if the server refuses.
    setHabits((cur) => cur?.map((h) => (h.id === habit.id ? { ...h, doneToday: true, currentStreak: h.currentStreak + 1 } : h)) ?? cur);
    try {
      await api(`/api/habits/${habit.id}/complete`, { method: 'POST', body: JSON.stringify({ date: today }) });
    } catch {
      // Roll the optimistic flip back first - nothing was saved, so the row must
      // not keep showing done. Then refresh from the server if it is reachable.
      setHabits((cur) => cur?.map((h) => (h.id === habit.id ? { ...h, doneToday: false, currentStreak: h.currentStreak - 1 } : h)) ?? cur);
      setError('Could not save that. Check your connection and try again.');
      load();
    }
  };

  const renderRight = (habit: Habit) => (
    <View style={{ justifyContent: 'center', backgroundColor: colors.done, borderRadius: 14, paddingHorizontal: 20, marginBottom: 10 }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Done</Text>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <Title>Today</Title>
        {error ? <ErrorBox message={error} /> : null}
        {habits === null ? (
          <CenteredLoading />
        ) : habits.length === 0 ? (
          <EmptyState title="No habits yet" hint="Tap + to add your first habit. Swipe right or press and hold to mark one done." />
        ) : (
          <FlatList
            data={habits}
            keyExtractor={(h) => h.id}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}
            renderItem={({ item }) => (
              <Swipeable renderRightActions={() => renderRight(item)} onSwipeableOpen={() => complete(item)}>
                <TouchableOpacity
                    onPress={() => navigation.navigate('HabitDetail', { habitId: item.id, name: item.name, color: item.color })}
                    onLongPress={() => complete(item)}
                    delayLongPress={400}
                    accessibilityLabel={`${item.name}, ${item.doneToday ? 'done' : 'not done'}. Swipe right or press and hold to complete.`}
                  >
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10,
                    borderRadius: 14, backgroundColor: colors.surface, borderWidth: 1,
                    borderColor: item.doneToday ? colors.done : colors.border,
                  }}>
                    <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: item.color, marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{item.name}</Text>
                      <Text style={{ color: colors.textMuted, marginTop: 2 }}>
                        {item.doneToday ? 'Done today' : item.currentStreak > 0 ? `${item.currentStreak} day streak` : 'Not done yet'}
                      </Text>
                    </View>
                    {item.doneToday ? <Text style={{ color: colors.done, fontSize: 18, fontWeight: '700' }}>✓</Text> : null}
                  </View>
                </TouchableOpacity>
              </Swipeable>
            )}
          />
        )}
        <TouchableOpacity
          style={{ position: 'absolute', right: 24, bottom: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => navigation.navigate('AddHabit')}
        >
          <Text style={{ color: colors.accentText, fontSize: 28, marginTop: -2 }}>+</Text>
        </TouchableOpacity>
      </Screen>
    </GestureHandlerRootView>
  );
}

import { startDay } from '../tracking';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { api, localToday } from '../api';
import { CenteredLoading, EmptyState, ErrorBox, FadeIn, LoadFailed, Screen } from '../components/ui';
import { useTheme } from '../theme';

function CheckCircle({ done, color, onPress, testID }: { done: boolean; color: string; onPress: () => void; testID: string }) {
  const { colors } = useTheme();
  const pop = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (done) Animated.sequence([
      Animated.timing(pop, { toValue: 1.25, duration: 130, useNativeDriver: false }),
      Animated.spring(pop, { toValue: 1, friction: 4, useNativeDriver: false }),
    ]).start();
  }, [done]);
  return (
    <Animated.View style={{ transform: [{ scale: pop }] }}>
      <TouchableOpacity
        testID={testID}
        accessibilityLabel={done ? 'Done' : 'Mark done'}
        onPress={onPress}
        hitSlop={8}
        style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2.5, borderColor: done ? colors.done : color, backgroundColor: done ? colors.done : 'transparent', alignItems: 'center', justifyContent: 'center' }}
      >
        {done ? <Text style={{ color: '#FFFFFF', fontSize: 17, fontWeight: '800', marginTop: -2 }}>✓</Text> : null}
      </TouchableOpacity>
    </Animated.View>
  );
}

interface Habit {
  id: string;
  createdAt: string;
  name: string;
  color: string;
  doneToday: boolean;
  currentStreak: number;
  bestStreak: number;
  doneDays: string[];
}

export default function TodayScreen({ navigation }: any) {
  const { colors, resolved } = useTheme();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const today = localToday();

  const load = async () => {
    try {
      setError(null);
      setHabits(await api<Habit[]>(`/api/habits?today=${today}`));
    } catch (e) {
      setError(e instanceof Error && !/fetch|network/i.test(e.message) ? e.message : /fetch|network/i.test(String((e as Error)?.message)) ? 'Could not reach the server. Check your connection and try again.' : 'Could not load habits');
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
      // Roll the optimistic flip back - nothing was saved, so the pre-flip
      // state already matches the server. No reload needed.
      setHabits((cur) => cur?.map((h) => (h.id === habit.id ? { ...h, doneToday: false, currentStreak: h.currentStreak - 1 } : h)) ?? cur);
      setError('Could not save that. Check your connection and try again.');
    }
  };

  const renderRight = (habit: Habit) => (
    <View style={{ justifyContent: 'center', backgroundColor: colors.done, paddingHorizontal: 26, marginBottom: 10, borderRadius: 18 }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Done</Text>
    </View>
  );

  const total = habits?.length ?? 0;
  const doneCount = habits?.filter((h) => h.doneToday).length ?? 0;
  const dateLabel = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - (6 - i) * 86400000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const n = (habits ?? []).filter((h) => h.doneDays.includes(key) || (key === today && h.doneToday)).length;
    const active = (habits ?? []).filter((h) => key >= startDay(h)).length;
    return { key, active, letter: ['S', 'M', 'T', 'W', 'T', 'F', 'S'][d.getDay()], day: d.getDate(), n, isToday: key === today };
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Screen>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8 }}>Today</Text>
          <Text style={{ color: colors.textMuted, fontWeight: '600', fontSize: 14 }}>{dateLabel}</Text>
        </View>
        {error && habits !== null ? <ErrorBox message={error} /> : null}
        {habits === null && error ? (
          <LoadFailed message={error} onRetry={load} />
        ) : habits === null ? (
          <CenteredLoading />
        ) : habits.length === 0 ? (
          <View style={{ flex: 1 }}>
            <EmptyState title="No habits yet" hint="Add your first habit. Tap the circle, swipe right or press and hold to mark one done." />
            <TouchableOpacity testID="fab-add" accessibilityLabel="New habit" onPress={() => navigation.navigate('AddHabit')} style={{ height: 54, borderRadius: 27, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 120 }}>
              <Text style={{ color: colors.accentText, fontWeight: '800', fontSize: 17 }}>+ New habit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              {week.map((d) => {
                const all = d.active > 0 && d.n === d.active;
                return (
                  <View key={d.key} style={{ alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{d.letter}</Text>
                    <View style={{
                      width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                      backgroundColor: all ? colors.accent : 'transparent',
                      borderWidth: 2, borderColor: all || d.n > 0 || d.isToday ? colors.accent : colors.border,
                    }}>
                      <Text style={{ color: all ? colors.accentText : colors.text, fontWeight: d.isToday ? '800' : '600', fontSize: 14 }}>{d.day}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, marginBottom: 14 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{doneCount} of {total} done today</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600' }}>Filled: all done  ·  Ring: some done</Text>
            </View>

            {habits.map((item, index) => (
              <FadeIn key={item.id} delay={index * 60}>
                <Swipeable renderRightActions={() => renderRight(item)} onSwipeableOpen={() => complete(item)}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => navigation.navigate('HabitDetail', { habitId: item.id, name: item.name, color: item.color })}
                    onLongPress={() => complete(item)}
                    delayLongPress={400}
                    accessibilityLabel={`${item.name}, ${item.doneToday ? 'done' : 'not done'}. Swipe right or press and hold to complete.`}
                  >
                    <View style={{ backgroundColor: colors.bg, borderRadius: 18, marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', height: 66, paddingHorizontal: 16, borderRadius: 18, backgroundColor: item.color + (resolved === 'dark' ? '33' : '1F') }}>
                      <CheckCircle done={item.doneToday} color={item.color} testID={`check-${index}`} onPress={() => complete(item)} />
                      <Text style={{ flex: 1, marginLeft: 14, fontSize: 17, fontWeight: '700', color: item.doneToday ? colors.textMuted : colors.text }}>{item.name}</Text>
                      <Text style={{ color: colors.textMuted, fontSize: 14, fontWeight: '700' }}>{item.currentStreak} {item.currentStreak === 1 ? 'day' : 'days'}</Text>
                    </View>
                    </View>
                  </TouchableOpacity>
                </Swipeable>
              </FadeIn>
            ))}
            <TouchableOpacity testID="fab-add" accessibilityLabel="New habit" onPress={() => navigation.navigate('AddHabit')} style={{ height: 56, borderRadius: 18, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
              <Text style={{ color: colors.accent, fontSize: 22, marginTop: -2 }}>+</Text>
              <Text style={{ color: colors.accent, fontWeight: '800', fontSize: 16 }}>New habit</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </Screen>
    </GestureHandlerRootView>
  );
}

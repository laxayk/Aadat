import { monthStats } from '../tracking';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { api, localToday } from '../api';
import { CenteredLoading, EmptyState, ErrorBox, FadeIn, LoadFailed, Ring, Screen } from '../components/ui';
import { monthGrid } from '../heatmap';
import { useTheme } from '../theme';

interface Habit {
  id: string;
  createdAt: string;
  name: string;
  color: string;
  currentStreak: number;
  bestStreak: number;
  doneDays: string[];
}

export default function StatsScreen() {
  const { colors, resolved } = useTheme();
  const [habits, setHabits] = useState<Habit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      setError(null);
      setHabits(await api<Habit[]>(`/api/habits?today=${localToday()}`));
    } catch (e) {
      setError(e instanceof Error && !/fetch|network/i.test(e.message) ? e.message : /fetch|network/i.test(String((e as Error)?.message)) ? 'Could not reach the server. Check your connection and try again.' : 'Could not load stats');
    }
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const weekAgo = new Date(Date.now() - 6 * 86400000);
  const weekPrefix = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const weekStart = weekPrefix(weekAgo);
  const doneThisWeek = (h: Habit) => h.doneDays.filter((d) => d >= weekStart).length;

  const dayKeys = Array.from({ length: 7 }, (_, i) => weekPrefix(new Date(Date.now() - (6 - i) * 86400000)));
  const dayInitial = (k: string) => ['S', 'M', 'T', 'W', 'T', 'F', 'S'][new Date(k + 'T12:00:00').getDay()];
  const totalDone = (habits ?? []).reduce((n, h) => n + doneThisWeek(h), 0);
  const totalPossible = (habits?.length ?? 0) * 7;

  const today = localToday();
  const monthKey = today.slice(0, 7);
  const dayOfMonth = Number(today.slice(8));
  const list = habits ?? [];
  const countOn = (date: string) => list.filter((h) => h.doneDays.includes(date)).length;
  const { rate, perfectDays, startOf } = monthStats(list, today);
  const bestStreak = list.reduce((m, h) => Math.max(m, h.bestStreak), 0);
  const cells = monthGrid(monthKey, []);
  const monthName = new Date(monthKey + '-01T12:00:00').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const module = { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 16, marginBottom: 14 } as const;
  const label = { color: colors.textMuted, fontWeight: '700', fontSize: 13, letterSpacing: 0.6 } as const;

  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginBottom: 14 }}>Overall</Text>
      {error && habits !== null ? <ErrorBox message={error} /> : null}
      {habits === null && error ? (
        <LoadFailed message={error} onRetry={load} />
      ) : habits === null ? (
        <CenteredLoading />
      ) : habits.length === 0 ? (
        <EmptyState title="Nothing to show yet" hint="Add a habit on the Today tab first." />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 130 }} showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} />}>
          <FadeIn>
            <View style={module}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17, textAlign: 'center', marginBottom: 12 }}>{monthName}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <View key={`w${i}`} style={{ width: '14.28%', alignItems: 'center', marginBottom: 4 }}>
                    <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '700' }}>{d}</Text>
                  </View>
                ))}
                {cells.map((c, i) => {
                  const n = c.date && c.date <= today ? countOn(c.date) : 0;
                  const active = c.date ? list.filter((h) => startOf(h) <= c.date!).length : 0;
                  const all = n > 0 && n === active;
                  return (
                    <View key={i} style={{ width: '14.28%', alignItems: 'center', paddingVertical: 3 }}>
                      {c.date ? (
                        <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: all ? colors.accent : 'transparent', borderWidth: 2, borderColor: n > 0 ? colors.accent : 'transparent' }}>
                          <Text style={{ fontSize: 13, fontWeight: '600', color: all ? colors.accentText : c.date > today ? colors.border : colors.text }}>{Number(c.date.slice(8))}</Text>
                        </View>
                      ) : <View style={{ width: 34, height: 34 }} />}
                    </View>
                  );
                })}
              </View>
            </View>
          </FadeIn>

          <FadeIn delay={80}>
            <View style={{ ...module, alignItems: 'center' }}>
              <Ring value={rate} size={150} color={colors.accent} track={colors.surfaceAlt}>
                <Text style={{ color: colors.text, fontSize: 34, fontWeight: '800', letterSpacing: -1 }}>{Math.round(rate * 100)}%</Text>
                <Text style={{ color: colors.textMuted, fontWeight: '600' }}>Monthly rate</Text>
              </Ring>
              <Text style={{ color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 10, textAlign: 'center' }}>Tracked from creation or earlier recorded history</Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 14, width: '100%' }}>
                <View style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 14 }}>
                  <Text style={label}>BEST STREAK</Text>
                  <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>{bestStreak}<Text style={{ fontSize: 14, color: colors.textMuted }}> days</Text></Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 16, padding: 14 }}>
                  <Text style={label}>PERFECT DAYS</Text>
                  <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>{perfectDays}<Text style={{ fontSize: 14, color: colors.textMuted }}> days</Text></Text>
                </View>
              </View>
            </View>
          </FadeIn>

          <Text style={{ ...label, marginBottom: 8, marginLeft: 4 }}>LAST 7 DAYS</Text>
          {habits.map((item, index) => (
            <FadeIn key={item.id} delay={index * 70}>
              <View style={{ backgroundColor: item.color + (resolved === 'dark' ? '33' : '1F'), borderRadius: 18, padding: 14, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, flex: 1 }}>{item.name}</Text>
                  <Text style={{ color: colors.textMuted, fontWeight: '700' }}>{doneThisWeek(item)}/7 · streak {item.currentStreak}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  {dayKeys.map((k) => (
                    <View key={k} style={{ alignItems: 'center', gap: 4 }}>
                      <View style={{ width: 30, height: 30, borderRadius: 8, backgroundColor: item.doneDays.includes(k) ? item.color : colors.surface }} />
                      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>{dayInitial(k)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </FadeIn>
          ))}
        </ScrollView>
      )}
    </Screen>
  );
}

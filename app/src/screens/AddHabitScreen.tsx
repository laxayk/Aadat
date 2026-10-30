import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { api } from '../api';
import { ErrorBox, Field, PrimaryButton, Screen, Title } from '../components/ui';
import { HABIT_COLORS, useTheme } from '../theme';

export default function AddHabitScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!name.trim()) return setError('Give the habit a name');
    setBusy(true);
    try {
      await api('/api/habits', { method: 'POST', body: JSON.stringify({ name: name.trim(), color }) });
      navigation.goBack();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the habit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>New habit</Title>
      {error ? <ErrorBox message={error} /> : null}
      <Field label="Name" value={name} onChange={setName} placeholder="Read 20 min" error={error ?? undefined} />
      <Text style={{ color: colors.textMuted, fontWeight: '600', marginBottom: 6 }}>Colour</Text>
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
        {HABIT_COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            onPress={() => setColor(c)}
            style={{
              width: 40, height: 40, borderRadius: 20, backgroundColor: c,
              borderWidth: 3, borderColor: color === c ? colors.text : 'transparent',
            }}
          />
        ))}
      </View>
      <PrimaryButton title="Save habit" onPress={save} loading={busy} disabled={!name.trim()} />
    </Screen>
  );
}

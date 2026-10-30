import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { clearToken } from '../api';
import { Card, Screen } from '../components/ui';
import { useTheme, type ThemeChoice } from '../theme';

const CHOICES: { key: ThemeChoice; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'dark', label: 'Dark' },
  { key: 'system', label: 'Match phone' },
];

export default function SettingsScreen({ onSignedOut }: { onSignedOut: () => void }) {
  const { colors, choice, setChoice } = useTheme();
  return (
    <Screen>
      <Text style={{ color: colors.text, fontSize: 36, fontWeight: '800', letterSpacing: -1, marginBottom: 14 }}>Settings</Text>
      <Card>
        <Text style={{ color: colors.textMuted, fontWeight: '700', marginBottom: 10 }}>Theme</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {CHOICES.map((c) => (
            <TouchableOpacity
              key={c.key}
              onPress={() => setChoice(c.key)}
              style={{
                flex: 1, paddingVertical: 14, borderRadius: 20, alignItems: 'center',
                backgroundColor: choice === c.key ? colors.accent : colors.surfaceAlt,
              }}
            >
              <Text style={{ color: choice === c.key ? colors.accentText : colors.text, fontWeight: '700' }}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>
      <Card>
        <TouchableOpacity onPress={async () => { await clearToken(); onSignedOut(); }}>
          <Text style={{ color: colors.danger, fontWeight: '800', fontSize: 16 }}>Log out</Text>
        </TouchableOpacity>
      </Card>
    </Screen>
  );
}

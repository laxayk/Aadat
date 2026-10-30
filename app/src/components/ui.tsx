import React, { useEffect, useRef } from 'react';
import { ActivityIndicator, Animated, Easing, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../theme';

export function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: 1, duration: 380, delay, easing: Easing.out(Easing.back(1.2)), useNativeDriver: false }).start();
  }, []);
  return (
    <Animated.View style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
      {children}
    </Animated.View>
  );
}

export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.screen, { backgroundColor: colors.bg }]}>{children}</View>;
}

export function Card({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();
  return <Text style={[styles.title, { color: colors.text }]}>{children}</Text>;
}

/** Animated horizontal progress bar (0..1). */
export function ProgressBar({ value, color, track, height = 10 }: { value: number; color: string; track: string; height?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(v, { toValue: Math.max(0, Math.min(1, value)), duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value]);
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
      <Animated.View style={{ height, borderRadius: height / 2, backgroundColor: color, width: v.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

/** Segmented progress ring made of ticks, so it needs no SVG dependency. */
export function Ring({ value, size, color, track, children }: { value: number; size: number; color: string; track: string; children?: React.ReactNode }) {
  const N = 48;
  const t = Math.max(8, Math.round(size / 9));
  const lit = Math.round(Math.max(0, Math.min(1, value)) * N);
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Array.from({ length: N }, (_, i) => (
        <View key={i} style={{ position: 'absolute', width: size, height: size, alignItems: 'center', transform: [{ rotate: `${(i * 360) / N}deg` }] }}>
          <View style={{ width: Math.max(3, size / 40), height: t, borderRadius: 2, backgroundColor: i < lit ? color : track }} />
        </View>
      ))}
      {children}
    </View>
  );
}

export function StreakPill({ days }: { days: number }) {
  const { colors } = useTheme();
  if (days <= 0) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginTop: 6 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginRight: 6 }} />
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{days} day streak</Text>
    </View>
  );
}

export function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address';
  secure?: boolean;
  error?: string;
}) {
  const { colors } = useTheme();
  const [focus, setFocus] = React.useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{props.label}</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: props.error ? colors.danger : focus ? colors.accent : colors.border, color: colors.text }]}
        value={props.value}
        onChangeText={props.onChange}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder={props.placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={props.keyboardType ?? 'default'}
        secureTextEntry={props.secure}
        autoCapitalize="none"
      />
      {props.error ? <Text style={[styles.error, { color: colors.danger }]}>{props.error}</Text> : null}
    </View>
  );
}

export function PrimaryButton(props: { title: string; onPress: () => void; disabled?: boolean; loading?: boolean }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const to = (n: number) => Animated.spring(scale, { toValue: n, friction: 6, tension: 220, useNativeDriver: false }).start();
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={() => to(0.96)}
        onPressOut={() => to(1)}
        style={[styles.button, { backgroundColor: colors.accent, opacity: props.disabled ? 0.5 : 1 }]}
        onPress={props.onPress}
        disabled={props.disabled || props.loading}
      >
        {props.loading ? <ActivityIndicator color={colors.accentText} /> : <Text style={[styles.buttonText, { color: colors.accentText }]}>{props.title}</Text>}
      </TouchableOpacity>
    </Animated.View>
  );
}

export function EmptyState(props: { title: string; hint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 5, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: colors.accent, fontSize: 24, fontWeight: '800', marginTop: -2 }}>+</Text>
        </View>
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>{props.title}</Text>
      {props.hint ? <Text style={[styles.emptyHint, { color: colors.textMuted }]}>{props.hint}</Text> : null}
    </View>
  );
}

export function ErrorBox(props: { message: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.errorBox, { borderColor: colors.danger, backgroundColor: colors.surface }]}>
      <Text style={{ color: colors.danger, fontWeight: '600' }}>{props.message}</Text>
    </View>
  );
}

export function LoadFailed({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Couldn't load</Text>
      <Text style={[styles.emptyHint, { color: colors.textMuted, marginBottom: 18 }]}>{message}</Text>
      <TouchableOpacity testID="retry" onPress={onRetry} style={{ height: 50, paddingHorizontal: 28, borderRadius: 25, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.accentText, fontWeight: '800', fontSize: 16 }}>Try again</Text>
      </TouchableOpacity>
    </View>
  );
}

export function CenteredLoading() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator size="large" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, paddingHorizontal: 20, paddingTop: 18 },
  card: { borderRadius: 24, borderWidth: 1, padding: 18, marginBottom: 14 },
  title: { fontSize: 34, fontWeight: '800', marginBottom: 14, letterSpacing: -1 },
  label: { fontSize: 14, marginBottom: 6, fontWeight: '700' },
  input: { borderWidth: 2, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, fontSize: 17 },
  error: { fontSize: 12, marginTop: 4 },
  button: { borderRadius: 28, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  buttonText: { fontSize: 17, fontWeight: '800' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptyHint: { fontSize: 15, textAlign: 'center', lineHeight: 22 },
  errorBox: { borderWidth: 2, borderRadius: 16, padding: 14, marginBottom: 14 },
});

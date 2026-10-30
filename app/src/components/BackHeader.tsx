import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../theme';

/** Simple back affordance for stack screens (headers are hidden app-wide). */
export function BackHeader({ title }: { title: string }) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 22, color: colors.accent, fontWeight: '800' }}>←</Text>
      </TouchableOpacity>
      <Text style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.5, color: colors.text, flex: 1 }} numberOfLines={1}>
        {title}
      </Text>
    </View>
  );
}

import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';

/** Brand splash: the logo pops in, the wordmark rises, a row of day dots fills in. */
export default function Splash({ onDone }: { onDone: () => void }) {
  const logo = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const dots = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 5, tension: 70, useNativeDriver: false }),
      Animated.timing(text, { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.timing(dots, { toValue: 7, duration: 1000, easing: Easing.linear, useNativeDriver: false }),
    ]).start(() => setTimeout(onDone, 150));
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: '#FFF1DE', alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{ opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }] }}>
        <Image source={require('../../assets/logo.png')} style={{ width: 132, height: 132, borderRadius: 40 }} />
      </Animated.View>
      <Animated.View style={{ opacity: text, marginTop: 24, alignItems: 'center', transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }] }}>
        <Text style={{ color: '#2A1A10', fontSize: 40, fontWeight: '800', letterSpacing: -1.5 }}>Aadat</Text>
        <Text style={{ color: '#F2622E', fontSize: 16, marginTop: 6, fontWeight: '700' }}>Small habits. Every day.</Text>
      </Animated.View>
      <View style={{ position: 'absolute', bottom: 80, flexDirection: 'row', gap: 10 }}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <Animated.View key={i} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: dots.interpolate({ inputRange: [i, i + 1], outputRange: ['#F3D9BD', '#F2622E'], extrapolate: 'clamp' }) }} />
        ))}
      </View>
    </View>
  );
}

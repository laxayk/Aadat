import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { loadToken } from './src/api';
import { ThemeProvider, useTheme } from './src/theme';
import { Screen } from './src/components/ui';
import AuthScreen from './src/screens/AuthScreen';
import TodayScreen from './src/screens/TodayScreen';
import StatsScreen from './src/screens/StatsScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import Splash from './src/components/Splash';
import SettingsScreen from './src/screens/SettingsScreen';

function TabIcon({ name, color }: { name: string; color: string }) {
  if (name === 'Stats') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 22 }}>
        {[10, 18, 14].map((h, i) => <View key={i} style={{ width: 5, height: h, borderRadius: 2, backgroundColor: color }} />)}
      </View>
    );
  }
  if (name === 'Today') {
    return (
      <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2.5, borderColor: color, alignItems: 'center', justifyContent: 'center', marginVertical: 1 }}>
        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      </View>
    );
  }
  return <Text style={{ fontSize: 20, lineHeight: 22, color }}>{'\u2699'}</Text>;
}

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs({ onSignedOut }: { onSignedOut: () => void }) {
  const { colors } = useTheme();
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute', left: 18, right: 18, bottom: 14, height: 84, paddingTop: 8, paddingBottom: 14,
          borderRadius: 34, backgroundColor: colors.surface, borderTopWidth: 0, borderWidth: 1, borderColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '800', lineHeight: 16 },
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
      })}
    >
      <Tabs.Screen name="Today" component={TodayScreen} />
      <Tabs.Screen name="Stats" component={StatsScreen} options={{ tabBarLabel: "Overall" }} />
      <Tabs.Screen name="Settings">
        {() => <SettingsScreen onSignedOut={onSignedOut} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

function Root() {
  const { colors, resolved } = useTheme();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    loadToken().then((t) => setSignedIn(t !== null));
  }, []);

  if (!splashDone || signedIn === null) return <Splash onDone={() => setSplashDone(true)} />;

  const navTheme = resolved === 'dark' ? DarkTheme : DefaultTheme;
  navTheme.colors.background = colors.bg;

  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={resolved === 'dark' ? 'light' : 'dark'} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!signedIn ? (
          <Stack.Screen name="Auth">{() => <AuthScreen onSignedIn={() => setSignedIn(true)} />}</Stack.Screen>
        ) : (
          <>
            <Stack.Screen name="Main">{() => <MainTabs onSignedOut={() => setSignedIn(false)} />}</Stack.Screen>
            <Stack.Screen name="HabitDetail" component={HabitDetailScreen} />
            <Stack.Screen name="AddHabit" component={AddHabitScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Root />
    </ThemeProvider>
  );
}

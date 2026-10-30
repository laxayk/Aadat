import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import { loadToken } from './src/api';
import { ThemeProvider, useTheme } from './src/theme';
import { CenteredLoading, Screen } from './src/components/ui';
import AuthScreen from './src/screens/AuthScreen';
import TodayScreen from './src/screens/TodayScreen';
import StatsScreen from './src/screens/StatsScreen';
import HabitDetailScreen from './src/screens/HabitDetailScreen';
import AddHabitScreen from './src/screens/AddHabitScreen';
import SettingsScreen from './src/screens/SettingsScreen';

function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = { Today: '\u2713', Stats: '\uD83D\uDCCA', Settings: '\u2699' };
  return <Text style={{ fontSize: 18, color }}>{icons[name] ?? '\u25CF'}</Text>;
}

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

function MainTabs({ onSignedOut }: { onSignedOut: () => void }) {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
      })}
    >
      <Tabs.Screen name="Today" component={TodayScreen} />
      <Tabs.Screen name="Stats" component={StatsScreen} />
      <Tabs.Screen name="Settings">
        {() => <SettingsScreen onSignedOut={onSignedOut} />}
      </Tabs.Screen>
    </Tabs.Navigator>
  );
}

function Root() {
  const { colors, resolved } = useTheme();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    loadToken().then((t) => setSignedIn(t !== null));
  }, []);

  if (signedIn === null) return <Screen><CenteredLoading /></Screen>;

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

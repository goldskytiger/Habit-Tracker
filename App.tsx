import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/AppContext';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { AuthScreen } from './src/auth/AuthScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { TodayScreen } from './src/screens/TodayScreen';
import { LogScreen } from './src/screens/LogScreen';
import { StatsScreen } from './src/screens/StatsScreen';
import { ChallengesScreen } from './src/screens/ChallengesScreen';
import { getHasOnboarded } from './src/storage';

const Tab = createBottomTabNavigator();
const PURPLE = '#6C47FF';

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = { Today: '☀️', Log: '📖', Stats: '📊', Goals: '🎯' };
  return (
    <Text style={{ fontSize: focused ? 22 : 20, opacity: focused ? 1 : 0.5 }}>
      {icons[label] ?? '•'}
    </Text>
  );
}

function MainTabs() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: PURPLE,
          tabBarInactiveTintColor: '#AAA',
          tabBarLabelStyle: styles.tabLabel,
          tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        })}
      >
        <Tab.Screen name="Today" component={TodayScreen} />
        <Tab.Screen name="Log" component={LogScreen} />
        <Tab.Screen name="Stats" component={StatsScreen} />
        <Tab.Screen name="Goals" component={ChallengesScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

function AppGate() {
  const { session, user } = useAuth();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) { setOnboarded(null); return; }
    getHasOnboarded(user.id).then(setOnboarded);
  }, [user?.id]);

  if (session === undefined || (session && onboarded === null)) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>🌱</Text>
        <ActivityIndicator color={PURPLE} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (session === null) return <AuthScreen />;

  return (
    <AppProvider userId={user!.id}>
      {onboarded ? (
        <MainTabs />
      ) : (
        <OnboardingScreen onComplete={() => setOnboarded(true)} />
      )}
    </AppProvider>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: { fontSize: 72 },
  tabBar: {
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    height: 80,
    paddingBottom: 16,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabLabel: { fontSize: 11, fontWeight: '600' },
});

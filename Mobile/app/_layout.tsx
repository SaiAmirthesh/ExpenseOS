import React, { useEffect } from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { 
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { Inter_400Regular, Inter_600SemiBold } from '@expo-google-fonts/inter';

import { queryClient } from '../src/services/queryClient';
import { AuthProvider, useAuth } from '../src/store/authContext';
import { Theme, Colors } from '../src/theme/theme';
import { ThemeProvider as AppThemeProvider, useTheme } from '../src/theme/ThemeContext';

// Keep splash screen visible until custom fonts load
SplashScreen.preventAutoHideAsync().catch(() => {});

function RouteGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { colors } = useTheme();

  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': PlusJakartaSans_400Regular,
    'PlusJakartaSans-SemiBold': PlusJakartaSans_600SemiBold,
    'PlusJakartaSans-Bold': PlusJakartaSans_700Bold,
    'PlusJakartaSans-ExtraBold': PlusJakartaSans_800ExtraBold,
    'Inter-Regular': Inter_400Regular,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // User is not logged in, redirect to login screen
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // User is logged in, redirect to main tabs
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments, fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, isLoading]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.logo}>Expense<Text style={[styles.logoHighlight, { color: colors.primary }]}>OS</Text></Text>
        <Text style={[styles.tagline, { color: colors.muted }]}>Personal & Group Expense Management</Text>
        <ActivityIndicator size="small" color={colors.primary} style={styles.spinner} />
      </View>
    );
  }

  return <Slot />;
}

function NavigationThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme, themeMode } = useTheme();
  return (
    <NavigationThemeProvider value={theme}>
      {children}
      <StatusBar style={themeMode === 'white' ? 'dark' : 'light'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppThemeProvider>
            <NavigationThemeWrapper>
              <RouteGuard />
            </NavigationThemeWrapper>
          </AppThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 40,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  logoHighlight: {
    // Dynamic color override is applied inline
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  spinner: {
    marginTop: 32,
  },
});


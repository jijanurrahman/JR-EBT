import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppTheme } from '@/theme';
import { getDatabase } from '@/db';
import { AppLockOverlay } from '@/components';
import { processRecurringRules } from '@/features/recurring/engine';
import { useUIStore } from '@/lib/store';
import { getSetting } from '@/db/queries';
import { getCurrencyInfo } from '@/lib/currencies';

export default function RootLayout() {
  const { colors, isDark } = useAppTheme();
  const [dbReady, setDbReady] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getDatabase()
      .then(async () => {
        try {
          const savedCurrency = await getSetting('currency', 'USD');
          const info = getCurrencyInfo(savedCurrency);
          useUIStore.getState().setCurrency(info.code, info.symbol);

          const generated = await processRecurringRules();
          if (generated > 0) {
            useUIStore.getState().bumpTransactionsVersion();
          }
        } catch (e) {
          console.warn('Failed to initialize app settings/rules:', e);
        }
        if (isMounted) setDbReady(true);
      })
      .catch((err) => {
        // App boundary error handling
        console.warn('Failed to initialize database:', err);
        if (isMounted) setDbReady(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (!dbReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AppLockOverlay />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.textPrimary,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/transaction"
          options={{
            presentation: 'modal',
            title: 'Transaction',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="modal/category"
          options={{
            presentation: 'modal',
            title: 'Categories',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="modal/recurring"
          options={{
            presentation: 'modal',
            title: 'Recurring Rules',
            headerShown: true,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}



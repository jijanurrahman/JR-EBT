import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppTheme } from '@/theme';
import { Button } from './Button';
import { useUIStore } from '@/lib/store';
import { getSetting } from '@/db/queries';

export function AppLockOverlay() {
  const { colors, spacing, typography } = useAppTheme();
  const { isAppLocked, setIsAppLocked } = useUIStore();

  const attemptUnlock = useCallback(async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock JR-EBT',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });
      if (result.success) {
        setIsAppLocked(false);
      }
    } catch (err) {
      console.warn('Auth error:', err);
    }
  }, [setIsAppLocked]);

  // Check on mount whether lock is enabled
  useEffect(() => {
    let mounted = true;
    getSetting('lock_enabled', '0').then((val) => {
      if (mounted && val === '1') {
        setIsAppLocked(true);
      }
    });
    return () => {
      mounted = false;
    };
  }, [setIsAppLocked]);

  // Auto-prompt on lock
  useEffect(() => {
    if (isAppLocked) {
      attemptUnlock();
    }
  }, [isAppLocked, attemptUnlock]);

  if (!isAppLocked) return null;

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <Text
        style={{
          color: colors.textPrimary,
          fontSize: typography.sizes.xxl,
          fontWeight: typography.weights.bold,
          marginBottom: spacing.sm,
        }}
      >
        🔒 JR-EBT
      </Text>
      <Text
        style={{
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          textAlign: 'center',
          marginBottom: spacing.xl,
          paddingHorizontal: spacing.xl,
        }}
      >
        This app is locked. Use your fingerprint or Face ID to unlock.
      </Text>
      <Button title="Unlock" onPress={attemptUnlock} variant="primary" size="lg" />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
});


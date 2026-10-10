import React, { useCallback, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { getSetting, setSetting } from '@/db/queries';
import { useAppTheme } from '@/theme';
import { useUIStore } from '@/lib/store';
import { exportTransactionsCsv } from '@/lib/csv';
import { formatDisplayMonth } from '@/lib/dates';
import { Button } from '@/components';

export function SettingsScreen() {
  const { colors, spacing, typography, radii } = useAppTheme();
  const { selectedMonth } = useUIStore();

  const [lockEnabled, setLockEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const [lockVal, hasHardware, isEnrolled] = await Promise.all([
        getSetting('lock_enabled', '0'),
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
      ]);
      setLockEnabled(lockVal === '1');
      setBiometricAvailable(hasHardware && isEnrolled);
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadSettings();
    }, [loadSettings]),
  );

  const handleToggleLock = async (enabled: boolean) => {
    if (enabled) {
      // Verify biometric before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify to enable biometric lock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (!result.success) {
        Alert.alert(
          'Authentication Failed',
          'Could not verify your identity. Biometric lock was not enabled.',
        );
        return;
      }
    }

    await setSetting('lock_enabled', enabled ? '1' : '0');
    setLockEnabled(enabled);
    useUIStore.getState().setIsAppLocked(false);

    Alert.alert(
      enabled ? 'Lock Enabled' : 'Lock Disabled',
      enabled
        ? 'The app will require biometric authentication when opened.'
        : 'The app will no longer require biometric authentication.',
    );
  };

  const handleTestBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Test Biometric Authentication',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });

    if (result.success) {
      Alert.alert('✅ Success', 'Biometric authentication worked correctly!');
    } else {
      Alert.alert(
        '❌ Failed',
        `Authentication failed: ${result.error || 'Unknown error'}`,
      );
    }
  };

  const handleExportMonth = async () => {
    try {
      setExporting(true);
      await exportTransactionsCsv(selectedMonth);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      Alert.alert('Export Error', message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportAll = async () => {
    try {
      setExporting(true);
      await exportTransactionsCsv();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Export failed';
      Alert.alert('Export Error', message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      {/* Data & Management Section */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          Data & Management
        </Text>
        <Button
          title="Manage Categories"
          onPress={() => router.push('/modal/category')}
          variant="secondary"
          style={{ marginBottom: spacing.sm }}
        />
        <Button
          title="Recurring Rules"
          onPress={() => router.push('/modal/recurring')}
          variant="secondary"
        />
      </View>

      {/* Export Section */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          Export Data
        </Text>
        <Button
          title={`Export ${formatDisplayMonth(selectedMonth)} as CSV`}
          onPress={handleExportMonth}
          variant="secondary"
          loading={exporting}
          disabled={exporting}
          style={{ marginBottom: spacing.sm }}
        />
        <Button
          title="Export All Transactions as CSV"
          onPress={handleExportAll}
          variant="secondary"
          loading={exporting}
          disabled={exporting}
        />
      </View>

      {/* Security Section */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: radii.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
          },
        ]}
      >
        <Text
          style={[
            styles.sectionTitle,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              marginBottom: spacing.md,
            },
          ]}
        >
          Security & Privacy
        </Text>

        {/* Biometric Lock Toggle */}
        <View
          style={[
            styles.settingRow,
            {
              paddingVertical: spacing.sm,
              borderBottomColor: colors.borderLight,
            },
          ]}
        >
          <View style={styles.settingLabel}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.semibold,
              }}
            >
              Biometric Lock
            </Text>
            <Text
              style={{
                color: colors.textMuted,
                fontSize: typography.sizes.xs,
                marginTop: 2,
              }}
            >
              {biometricAvailable
                ? 'Require fingerprint or Face ID to open the app'
                : 'No biometric hardware detected on this device'}
            </Text>
          </View>
          <Switch
            value={lockEnabled}
            onValueChange={handleToggleLock}
            disabled={!biometricAvailable || loadingSettings}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={lockEnabled ? colors.primary : colors.textMuted}
          />
        </View>

        {/* Test Biometric Button */}
        {biometricAvailable ? (
          <Button
            title="🔐 Test Fingerprint / Face ID"
            onPress={handleTestBiometric}
            variant="secondary"
            style={{ marginTop: spacing.md }}
          />
        ) : null}
      </View>

      {/* App Info */}
      <View style={{ alignItems: 'center', marginTop: spacing.md }}>
        <Text
          style={{
            color: colors.textMuted,
            fontSize: typography.sizes.xs,
          }}
        >
          JR-EBT v1.0.0 • All data stored on-device
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    borderWidth: 1,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: {
    flex: 1,
    marginRight: 12,
  },
});

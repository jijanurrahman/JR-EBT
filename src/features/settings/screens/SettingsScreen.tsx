import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { getSetting, setSetting } from '@/db/queries';
import { useAppTheme } from '@/theme';
import { useUIStore } from '@/lib/store';
import { exportTransactionsCsv } from '@/lib/csv';
import { formatDisplayMonth } from '@/lib/dates';
import {
  CurrencyInfo,
  getCurrencyInfo,
  SUPPORTED_CURRENCIES,
} from '@/lib/currencies';
import { Button } from '@/components';

export function SettingsScreen() {
  const { colors, spacing, typography, radii } = useAppTheme();
  const { selectedMonth, currency, setCurrency } = useUIStore();

  const [lockEnabled, setLockEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const currentCurrencyInfo = getCurrencyInfo(currency);

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
      // Verify fingerprint before enabling
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirm Fingerprint',
        promptSubtitle: 'Touch the fingerprint sensor to enable biometric lock',
        cancelLabel: 'Cancel',
        disableDeviceFallback: true,
        biometricsSecurityLevel: 'strong',
      });

      if (!result.success) {
        Alert.alert(
          'Authentication Failed',
          'Could not verify your fingerprint. Biometric lock was not enabled.',
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
        ? 'The app will require your fingerprint when opened.'
        : 'The app will no longer require fingerprint authentication.',
    );
  };

  const handleTestBiometric = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Test Fingerprint Authentication',
      promptSubtitle: 'Touch the fingerprint sensor',
      cancelLabel: 'Cancel',
      disableDeviceFallback: true,
      biometricsSecurityLevel: 'strong',
    });

    if (result.success) {
      Alert.alert('✅ Success', 'Fingerprint sensor verified successfully!');
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

  const handleSelectCurrency = async (selected: CurrencyInfo) => {
    try {
      await setSetting('currency', selected.code);
      setCurrency(selected.code, selected.symbol);
      setCurrencyModalVisible(false);
      Alert.alert(
        'Currency Updated',
        `Currency updated to ${selected.name} (${selected.symbol}). All displays will now format in ${selected.code}.`,
      );
    } catch (err) {
      console.warn('Failed to save currency:', err);
      Alert.alert('Error', 'Failed to update currency setting.');
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: spacing.lg }}
    >
      {/* Currency Modal */}
      <Modal
        visible={currencyModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCurrencyModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setCurrencyModalVisible(false)}
        >
          <Pressable
            style={[
              styles.modalCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: radii.xl,
                padding: spacing.lg,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: spacing.md,
                paddingBottom: spacing.sm,
                borderBottomColor: colors.borderLight,
                borderBottomWidth: 1,
              }}
            >
              <Text
                style={{
                  color: colors.textPrimary,
                  fontSize: typography.sizes.lg,
                  fontWeight: typography.weights.bold,
                }}
              >
                Select Currency
              </Text>
              <Pressable
                onPress={() => setCurrencyModalVisible(false)}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            <FlatList
              data={SUPPORTED_CURRENCIES}
              keyExtractor={(item) => item.code}
              style={{ maxHeight: 400 }}
              renderItem={({ item }) => {
                const isSelected = item.code === currency;
                return (
                  <Pressable
                    onPress={() => handleSelectCurrency(item)}
                    style={({ pressed }) => [
                      styles.currencyItem,
                      {
                        backgroundColor: isSelected
                          ? `${colors.primary}15`
                          : pressed
                            ? colors.borderLight
                            : 'transparent',
                        borderRadius: radii.md,
                        paddingVertical: spacing.md,
                        paddingHorizontal: spacing.md,
                        marginBottom: 4,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.currencySymbolBadge,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.borderLight,
                          borderRadius: radii.md,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: isSelected ? '#FFFFFF' : colors.textPrimary,
                          fontWeight: typography.weights.bold,
                          fontSize: typography.sizes.sm,
                        }}
                      >
                        {item.symbol}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: spacing.md }}>
                      <Text
                        style={{
                          color: colors.textPrimary,
                          fontSize: typography.sizes.md,
                          fontWeight: isSelected
                            ? typography.weights.bold
                            : typography.weights.medium,
                        }}
                      >
                        {item.name}
                      </Text>
                      <Text
                        style={{
                          color: colors.textSecondary,
                          fontSize: typography.sizes.xs,
                          marginTop: 2,
                        }}
                      >
                        {item.code}
                      </Text>
                    </View>

                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary}
                      />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
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

      {/* Currency Preference Section */}
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
          Currency Preference
        </Text>

        <Pressable
          onPress={() => setCurrencyModalVisible(true)}
          style={({ pressed }) => [
            styles.currencySelector,
            {
              backgroundColor: pressed ? colors.borderLight : colors.background,
              borderColor: colors.border,
              borderRadius: radii.md,
              padding: spacing.md,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.textPrimary,
                fontSize: typography.sizes.md,
                fontWeight: typography.weights.semibold,
              }}
            >
              {currentCurrencyInfo.name} ({currentCurrencyInfo.symbol})
            </Text>
            <Text
              style={{
                color: colors.textSecondary,
                fontSize: typography.sizes.xs,
                marginTop: 2,
              }}
            >
              Code: {currentCurrencyInfo.code} • Symbol: {currentCurrencyInfo.symbol}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </Pressable>
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
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
  },
  currencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbolBadge: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '@/theme';

interface SnackbarProps {
  visible: boolean;
  message: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss: () => void;
  duration?: number;
}

export function Snackbar({
  visible,
  message,
  actionText = 'UNDO',
  onAction,
  onDismiss,
  duration = 4000,
}: SnackbarProps) {
  const { colors, spacing, radii, typography } = useAppTheme();

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, duration);
    return () => clearTimeout(timer);
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          bottom: spacing.xxl,
          marginHorizontal: spacing.lg,
          backgroundColor: colors.textPrimary,
          borderRadius: radii.md,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.md,
        },
      ]}
    >
      <Text
        style={[
          styles.message,
          {
            color: colors.textInverse,
            fontSize: typography.sizes.sm,
          },
        ]}
      >
        {message}
      </Text>
      {onAction ? (
        <Pressable onPress={onAction} style={styles.actionButton}>
          <Text
            style={[
              styles.actionText,
              {
                color: colors.primaryLight,
                fontSize: typography.sizes.sm,
                fontWeight: typography.weights.bold,
              },
            ]}
          >
            {actionText}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 999,
  },
  message: {
    flex: 1,
    marginRight: 8,
  },
  actionButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionText: {},
});


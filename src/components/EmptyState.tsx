import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme';
import { Button } from './Button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionTitle?: string;
  onActionPress?: () => void;
  style?: ViewStyle;
}

export function EmptyState({
  title,
  description,
  actionTitle,
  onActionPress,
  style,
}: EmptyStateProps) {
  const { colors, spacing, typography } = useAppTheme();

  return (
    <View style={[styles.container, { padding: spacing.xxl }, style]}>
      <Text
        style={[
          styles.title,
          {
            color: colors.textPrimary,
            fontSize: typography.sizes.lg,
            marginBottom: spacing.xs,
          },
        ]}
      >
        {title}
      </Text>
      <Text
        style={[
          styles.description,
          {
            color: colors.textMuted,
            fontSize: typography.sizes.sm,
            marginBottom: actionTitle ? spacing.lg : 0,
          },
        ]}
      >
        {description}
      </Text>
      {actionTitle && onActionPress ? (
        <Button title={actionTitle} onPress={onActionPress} variant="primary" size="md" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
  },
});

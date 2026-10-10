import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { useAppTheme } from '@/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { colors, radii, spacing, typography } = useAppTheme();

  const getContainerStyle = (pressed: boolean): ViewStyle => {
    let backgroundColor: string = colors.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    if (variant === 'secondary') {
      backgroundColor = colors.surface;
      borderColor = colors.border;
      borderWidth = 1;
    } else if (variant === 'danger') {
      backgroundColor = colors.danger;
    } else if (variant === 'ghost') {
      backgroundColor = 'transparent';
    }

    const paddingVertical =
      size === 'sm' ? spacing.xs : size === 'lg' ? spacing.md : spacing.sm + 2;
    const paddingHorizontal = size === 'sm' ? spacing.sm : size === 'lg' ? spacing.xl : spacing.lg;

    return {
      backgroundColor,
      borderColor,
      borderWidth,
      borderRadius: radii.md,
      paddingVertical,
      paddingHorizontal,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
    };
  };

  const getTextStyle = (): TextStyle => {
    let color: string = colors.textInverse;

    if (variant === 'secondary') {
      color = colors.textPrimary;
    } else if (variant === 'ghost') {
      color = colors.primary;
    }

    const fontSize =
      size === 'sm'
        ? typography.sizes.sm
        : size === 'lg'
          ? typography.sizes.lg
          : typography.sizes.md;

    return {
      color,
      fontSize,
      fontWeight: typography.weights.semibold,
    };
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [styles.base, getContainerStyle(pressed), style]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === 'secondary' || variant === 'ghost' ? colors.primary : colors.textInverse
          }
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
  },
});

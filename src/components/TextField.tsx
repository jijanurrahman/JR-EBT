import React, { forwardRef } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  prefix?: string;
  containerStyle?: ViewStyle;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helperText, prefix, containerStyle, style, ...inputProps },
  ref,
) {
  const { colors, spacing, radii, typography } = useAppTheme();

  const borderColor = error ? colors.danger : colors.border;

  return (
    <View style={[styles.container, containerStyle]}>
      {label ? (
        <Text
          style={[
            styles.label,
            {
              color: colors.textSecondary,
              fontSize: typography.sizes.sm,
              marginBottom: spacing.xs,
            },
          ]}
        >
          {label}
        </Text>
      ) : null}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor,
            borderRadius: radii.md,
            paddingHorizontal: spacing.md,
          },
        ]}
      >
        {prefix ? (
          <Text
            style={[
              styles.prefix,
              {
                color: colors.textMuted,
                fontSize: typography.sizes.md,
                marginRight: spacing.xs,
              },
            ]}
          >
            {prefix}
          </Text>
        ) : null}

        <TextInput
          ref={ref}
          placeholderTextColor={colors.textMuted}
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontSize: typography.sizes.md,
              paddingVertical: spacing.md,
            },
            style,
          ]}
          {...inputProps}
        />
      </View>

      {error ? (
        <Text
          style={[
            styles.errorText,
            {
              color: colors.danger,
              fontSize: typography.sizes.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          {error}
        </Text>
      ) : helperText ? (
        <Text
          style={[
            styles.helperText,
            {
              color: colors.textMuted,
              fontSize: typography.sizes.xs,
              marginTop: spacing.xs,
            },
          ]}
        >
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minHeight: 48,
  },
  prefix: {
    fontWeight: '500',
  },
  input: {
    flex: 1,
  },
  errorText: {
    fontWeight: '500',
  },
  helperText: {
    fontWeight: '400',
  },
});

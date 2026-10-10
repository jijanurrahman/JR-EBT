import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { useAppTheme } from '@/theme';

interface ProgressBarProps {
  percent: number;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ percent, height = 8, style }: ProgressBarProps) {
  const { colors, radii } = useAppTheme();

  // Clamp visual fill to 100% so bar doesn't overflow container
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  let fillColor = colors.primary;
  if (percent >= 100) {
    fillColor = colors.danger;
  } else if (percent >= 80) {
    fillColor = colors.warning;
  }

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: colors.borderLight,
          borderRadius: radii.full,
        },
        style,
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedPercent}%`,
            backgroundColor: fillColor,
            borderRadius: radii.full,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});

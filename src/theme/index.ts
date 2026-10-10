import { useColorScheme } from 'react-native';
import { lightColors, darkColors, categoryColors, ThemeColors } from './colors';
import { spacing, radii } from './spacing';
import { typography } from './typography';

export interface AppTheme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  categoryColors: string[];
}

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';

  return {
    isDark,
    colors: isDark ? darkColors : lightColors,
    spacing,
    radii,
    typography,
    categoryColors,
  };
}

export { lightColors, darkColors, categoryColors, spacing, radii, typography };

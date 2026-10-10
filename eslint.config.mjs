import js from '@eslint/js';
import tsPlugin from 'typescript-eslint';
import prettierConfig from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', '.expo/**', 'dist/**', 'coverage/**', '**/._*', '**/.DS_Store'],
  },
  js.configs.recommended,
  ...tsPlugin.configs.recommended,
  prettierConfig,
  {
    files: ['jest.config.js', 'metro.config.js'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];

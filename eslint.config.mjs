// ESLint flat config (#163/D — migrated from .eslintrc.cjs for ESLint 9).
// Rule set is a faithful port of the old config: the same recommended presets
// (JS, typescript-eslint, react, react-hooks) and the same rule overrides, so
// lint output is unchanged by the migration.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  // Replaces the old `ignorePatterns`. A config object with only `ignores` is a
  // global ignore in flat config.
  {
    ignores: [
      'dist/',
      'node_modules/',
      'xp-research/',
      'cn-net-research/',
      'test-results/',
      'playwright-report/',
      // The consumer-smoke fixture (#206) is a standalone template app that
      // imports the published package — it isn't repo source and can't resolve
      // '@caoergou/windows-xp' here, so keep it out of lint/type scope.
      'scripts/consumer-smoke/consumer/',
      // The docs site (#214) is a self-contained VitePress workspace with its
      // own toolchain; it isn't part of the engine's lint/type scope.
      'docs-site/',
      // Faithful port of the old `--ext ts,tsx`: only TypeScript sources are
      // linted (config files and .mjs build/CI scripts were never in scope).
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      react,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Ported verbatim from .eslintrc.cjs.
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      // `caughtErrors: 'none'` matches the typescript-eslint v5 default the old
      // config relied on, so the migration doesn't newly flag unused `catch (e)`
      // bindings.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      // typescript-eslint v5 `recommended` warned on non-null assertions; v8
      // moved it to `strict`. Keep it on so the migration preserves the warning
      // set (and the existing eslint-disable directives stay meaningful).
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-expect-error': 'allow-with-description',
          'ts-ignore': 'allow-with-description',
          'ts-nocheck': 'allow-with-description',
          'ts-check': false,
          minimumDescriptionLength: 10,
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  }
);

import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Lint had never run in CI, so 44 errors had accumulated and any attempt
      // to switch it on failed immediately. Waiting for a clean sweep meant the
      // rules that catch REAL defects stayed off too - including
      // react-hooks/rules-of-hooks, which names the exact mistake that left
      // every Creative Attention report blank in production (#156, fixed #160).
      //
      // So the backlog of stylistic findings is demoted to warnings and the rest
      // of the config starts blocking now. These four are a debt to pay down,
      // not a standard we accept: they still print on every run.
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-useless-escape': 'warn',
      'prefer-const': 'warn',
    },
  }
);

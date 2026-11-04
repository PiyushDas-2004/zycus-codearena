import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'dist-mock', 'coverage', 'node_modules', 'public', 'supabase/seed/**'] },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strict],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      // Security: never build HTML from strings; markdown goes through the sanitizing renderer.
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'dangerouslySetInnerHTML is forbidden. Use the sanitized <Markdown> component.',
        },
      ],
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      // Performance / CSP: keep heavy or eval-probing libraries out of candidate pages.
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'zod', message: "Import { z } from '@/shared/zod' (configured for our CSP)." },
            {
              name: '@supabase/supabase-js',
              message:
                'Candidate pages call the API with fetch (supabaseCandidateApi.ts). The full client is for the admin portal only.',
            },
          ],
        },
      ],
    },
  },
  { files: ['src/shared/zod.ts'], rules: { 'no-restricted-imports': 'off' } },
  {
    // The test sandbox runs candidates' tests in a worker and mirrors Jest's own patterns.
    files: ['src/features/runner/sandbox/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-invalid-void-type': 'off',
      'no-console': 'off',
    },
  },
  {
    files: ['src/features/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: [{ name: 'zod', message: "Import { z } from '@/shared/zod' (configured for our CSP)." }] },
      ],
    },
  },
  {
    files: ['vite.config.ts', 'scripts/**/*.{js,mjs,ts}', 'supabase/tests/**/*.ts', 'eslint.config.js'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2023, globals: globals.node },
  },
);

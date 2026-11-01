// One ESLint config for the whole repo, so server and client follow the same rules.
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'edu-backend/uploads/**',
      'edu-backend/.local-db/**',
    ],
  },

  js.configs.recommended,

  // Rules shared by server and client
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
      // console.log is for debugging only; use console.info/warn/error for real messages
      'no-console': ['error', { allow: ['info', 'warn', 'error', 'table'] }],
    },
  },

  // Server (Node.js)
  {
    files: ['edu-backend/**/*.js', '*.js'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['edu-backend/tests/**/*.js'],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },

  // Client (React in the browser)
  {
    files: ['edu-frontend/**/*.{js,jsx}'],
    plugins: { react, 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react/prop-types': 'off',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // The client must not leave console output behind (see CLAUDE.md "Frontend rules")
      'no-console': ['error', { allow: ['error'] }],
    },
  },
  {
    files: ['edu-frontend/vite.config.js'],
    languageOptions: { globals: globals.node },
  },

  // Must stay last: turns off style rules that Prettier handles
  prettier,
];

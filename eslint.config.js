import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
    js.configs.recommended,
    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: typescriptParser,
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                ...globals.browser,
                ...globals.es2022,
            },
        },
        plugins: {
            '@typescript-eslint': typescript,
        },
        rules: {
            ...typescript.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/no-explicit-any': 'warn',
            'no-console': 'warn',
            'no-unused-vars': 'off', // Use TypeScript version instead
            '@typescript-eslint/no-namespace': 'off',
        },
    },
    {
        files: ['**/*.js', '**/*.jsx'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2022,
            },
        },
    },
    {
        files: ['vite.config.js', 'vite.config.ts'],
        languageOptions: {
            globals: {
                ...globals.node,
            },
        },
    },
    {
        ignores: [
            'dist/**',
            'node_modules/**',
            'coverage/**',
            'backend/**',
            '.vscode/**',
        ],
    },
];
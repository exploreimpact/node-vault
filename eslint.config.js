import js from '@eslint/js';

export default [
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: true,
        process: true,
        Buffer: true,
        URL: true,
        require: true,
        module: true,
        __dirname: true,
        __filename: true,
        describe: true,
        test: true,
        expect: true,
      },
    },
    plugins: {},
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },
];

import js from '@eslint/js'
import globals from 'globals'

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        mermaid: 'readonly',
        gifshot: 'readonly',
        PptxGenJS: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'no-empty': 'warn',
      'no-useless-escape': 'warn',
      'no-undef': 'warn',
    },
  },
]

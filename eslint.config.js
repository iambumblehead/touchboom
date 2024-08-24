import js from '@eslint/js'
import markdown from 'eslint-plugin-markdown'

export default [
  {
    ignores: [
      "public/**"
    ]
  },
  js.configs.recommended,
  ...markdown.configs.recommended,
  {
    ignores: [],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        requestAnimationFrame: true,
        document: true,
        window: true,
        Set: true,
        console: true,
        setTimeout: true,
        fetch: true,
        process: true,
        URL: true,
        global: true,
        test: true
      }
    },
    rules: {
      "global-require": 0,
      "no-sequences": 0,
      "strict": [2, "never"],
      "one-var": [2, {
        "let": "always",
        "const": "never"
      }],
      "space-in-parens": [2, "never" ],
      "indent": [2, 2, {
        "flatTernaryExpressions": true,
        "VariableDeclarator": {
          "let": 2,
          "const": 3
        }
      }],
      "camelcase": 0,
      "func-names": [2, "never"],
      "newline-per-chained-call": 0,
      "max-len": [2, 200],
      "comma-dangle": [2, "never"],
      "prefer-template": 0,
      "no-use-before-define": 0,
      "no-mixed-operators": 0,
      "no-plusplus": 0,
      "no-console": 0,
      "object-curly-newline": 0,
      "nonblock-statement-body-position": 0,
      "arrow-parens": [2, "as-needed"],
      "space-before-function-paren": [2, "always"],
      "function-paren-newline": 0,
      "consistent-return": 0,
      "array-callback-return": 0,
      "prefer-const": 0,
      "curly": 0,
      "operator-linebreak": 0,
      "no-param-reassign": 0,
      "implicit-arrow-linebreak": 0,
      "no-shadow": [0, "warn", {
        "allow": [ "err" ]
      }
      ],
      "prefer-arrow-callback": [2, {
        "allowNamedFunctions": true
      }],
      "no-return-assign": 0,
      "no-nested-ternary": 0,
      "array-bracket-spacing": [0, "always"],
      "prefer-destructuring": 2,
      "class-methods-use-this": 0,
      "no-confusing-arrow": 0
    }
  }
]

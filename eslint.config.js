// ESLint v9 flat config
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";

export default [
  {
    ignores: [
      "dist/**",
      "release/**",
      "node_modules/**",
      ".autonomy/**",
      "package-lock.json",
      "tools/autonomy-monitor/index.html",
      "coverage/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2022 },
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    },
    plugins: {
      react,
      "react-hooks": reactHooks
    },
    settings: {
      react: { version: "detect" }
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "no-empty": ["warn", { allowEmptyCatch: true }]
    }
  },
  {
    files: ["main.js", "preload.js", "electron/**/*.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
      sourceType: "commonjs"
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-unused-vars": "off"
    }
  },
  {
    files: ["tools/**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
      sourceType: "module"
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
      ],
      "no-empty": ["warn", { allowEmptyCatch: true }],
      "no-redeclare": "off",
      "no-unused-vars": "off"
    }
  },
  {
    files: ["tests/**/*.{js,ts,mjs}", "**/*.test.{js,ts,tsx,mjs}"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 },
      sourceType: "module"
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "no-unused-vars": "off"
    }
  },
  {
    files: ["vite.config.ts", "vitest.config.ts", "eslint.config.js"],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2022 }
    }
  },
  prettier
];

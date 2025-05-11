// eslint.config.mjs
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";
import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize FlatCompat for eslint:recommended
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: {},
});

export default [
  {
    ignores: [
        ".next/**",
        "node_modules/**",
        "postcss.config.js",
        "next.config.mjs", // Usually not linted with app rules
    ],
  },

  // Base recommended rules (via FlatCompat)
  ...compat.extends("eslint:recommended"),

  // React specific configurations
  {
    files: ["**/*.{js,jsx,mjs}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }],
      "no-undef": "error",
      "no-console": ["warn", { "allow": ["warn", "error", "info"] }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        sourceType: "module",
        ecmaVersion: 2022, // or "latest"
      },
      globals: {
        ...globals.browser,
      }
    }
  },

  // Next.js specific configurations
  // Apply these as a distinct configuration object
  {
    files: ["**/*.{js,jsx,mjs}"], // Adjust if you have specific Next.js files (e.g. pages, app router components)
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      // Start with Next.js recommended rules
      ...nextPlugin.configs.recommended.rules,
      // Add core web vitals rules
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
    languageOptions: { // Next.js files can run in browser or Node.js environments
        globals: {
            ...globals.browser,
            ...globals.node,
        }
    }
  },
  // Config for Node.js specific files (like config files themselves if you want to lint them)
  {
    files: ["*.config.js", "*.config.mjs" ], // Target config files if needed
    languageOptions: {
        globals: {
            ...globals.node,
        }
    }
  }
];

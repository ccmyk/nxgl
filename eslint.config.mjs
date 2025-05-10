// eslint.config.mjs
import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next"; // Correct import for plugin
import reactRecommended from "eslint-plugin-react/configs/recommended.js";
import hooksPlugin from "eslint-plugin-react-hooks";
// If you decide to use TypeScript later or for stricter JS:
// import tseslint from 'typescript-eslint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: true, // Ensure compatibility with recommended configurations
});

export default [
  {
    ignores: [".next/**"], // IMPORTANT: Ignore the .next directory
  },
  { // Base ESLint recommended rules
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "error",
      "eqeqeq": "warn",
      "curly": "error",
      "no-console": "warn",
    },
  },
  { // React specific configurations
    files: ["**/*.{js,jsx,mjs,cjs,ts,tsx}"],
    plugins: {
      react: reactRecommended.plugins.react, // Access plugin correctly
      "react-hooks": hooksPlugin,
    },
    rules: {
      ...reactRecommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off", // Not needed with Next.js 17+ / React 17+
      "react/prop-types": "off", // Typically handled by TypeScript or not used in JS projects
    },
    settings: {
      react: {
        version: "detect", // Automatically detect React version
      },
    },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node, // Add node globals if you have backend code / next.config.js etc.
      }
    }
  },
  { // Next.js specific configurations
    files: ["**/*.{js,jsx,mjs}"],
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  // If you add TypeScript:
  // ...tseslint.configs.recommended,
]
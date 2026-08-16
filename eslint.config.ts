import eslint from "@eslint/js";
import { Linter } from "eslint";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import i18next from "eslint-plugin-i18next";
import { importX as importPlugin } from "eslint-plugin-import-x";
import reactPlugin from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";
import path from "path";
import tseslint from "typescript-eslint";

export default defineConfig(
  eslint.configs.recommended,
  tseslint.configs.strict,
  tseslint.configs.stylistic,
  reactPlugin.configs.flat.recommended,
  reactPlugin.configs.flat["jsx-runtime"],
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  i18next.configs["flat/recommended"] as Linter.Config, // https://github.com/edvardchen/eslint-plugin-i18next/issues/142
  {
    plugins: {
      react: reactPlugin,
    },
    rules: {
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        {
          ignore: ["css"],
        },
      ],
      "react/forbid-elements": [
        "warn",
        {
          forbid: [
            { element: "Container", message: "use <FlexContainer> instead" },
            { element: "Row", message: "use <FlexRow> instead" },
            { element: "Col", message: "use <FlexCol> instead" },
            { element: "Stack", message: "use <FlexRow> or <FlexCol> instead" },
          ],
        },
      ],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "warn",
        { considerDefaultExhaustiveForUnions: true },
      ],
      "no-warning-comments": "warn",
      "i18next/no-literal-string": [
        "warn",
        {
          words: {
            exclude: [
              // https://github.com/edvardchen/eslint-plugin-i18next/issues/117
              // https://github.com/edvardchen/eslint-plugin-i18next/blob/97604c7e6da8bc5ceb17b5fd40736bb6f620359e/lib/options/defaults.json#L21
              "[0-9!-/:-@[-`{-~]+",
              "[A-Z_-]+",
              "x", // Resolutions, e.g. `${width}x${height}`
              "[A-Z]:\\\\[a-zA-Z0-9()_\\- \\\\]*", // Windows/DOS paths, e.g. "C:\Program Files (x86)\..."
              "Quick Configuration", // Application name
              "\\[Archive\\]\\s?sResource[a-zA-Z0-9]+List(\\s?\\(.*\\))?", // Ini resource list string
            ],
          },
        },
      ],
    },
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
      },
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          // The resolver refuses to use the alias defined in tsconfig.json for some reason,
          // so it has to be defined with an absolute path here (and relative paths don't work either)
          alias: {
            "@/*": [path.resolve(__dirname, "./src/*")],
          },
          alwaysTryTypes: true,
        }),
      ],
      react: {
        version: "detect",
      },
    },
  },
  globalIgnores(["**/node_modules", "**/dist"]),
);

const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const prettierPlugin = require("eslint-plugin-prettier");
const prettierConfig = require("eslint-config-prettier");
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
    js.configs.recommended,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                ...globals.node,
                ...globals.jest,
            },
        },
        plugins: {
            "@typescript-eslint": tsPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            ...prettierConfig.rules,
            "prettier/prettier": "error",
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
            "no-undef": "error",
        },
    },
    {
        ignores: ["node_modules/**", "dist/**", "web/**", "coverage/**", "*.js"],
    },
];

import path from "node:path";
import { defineConfig } from "eslint/config";
import { includeIgnoreFile } from "@eslint/compat";
import tsParser from "@typescript-eslint/parser";
import eslint from "@eslint/js";
import { configs as tsEslintConfigs } from "typescript-eslint";
import packageJson from "eslint-plugin-package-json";
import unicorn from "eslint-plugin-unicorn";
import vitest from "@vitest/eslint-plugin";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import importX from "eslint-plugin-import-x";

const __dirname = import.meta.dirname;
const gitignorePath = path.resolve(__dirname, ".gitignore");

/**
 * The function name used when testing Effects
 */
const EFFECT_TEST_FUNCTION_NAMES = [
  "it.effect",
  "it.effect.fails",
  "it.effect.skip",

  "it.live",
  "it.live.fails",
  "it.live.skip",
];

const config = defineConfig([
  // This is technically deprecated, but I like having everything defined in one place,
  // rather than duplicating the ignore list here
  includeIgnoreFile(gitignorePath),

  // Rules for regular library code
  eslint.configs.recommended,
  tsEslintConfigs.eslintRecommended,
  tsEslintConfigs.strict,
  tsEslintConfigs.stylistic,
  unicorn.configs.all,
  // eslint-plugin-import-x registered under the `import` key so the rule
  // entries below keep their familiar `import/*` names. This is a pure-library
  // package, so we wire the import plugin in directly rather than inheriting it
  // transitively from a framework preset.
  {
    plugins: { import: importX },
    settings: {
      "import-x/resolver": {
        typescript: { project: "./tsconfig.eslint.json" },
        node: true,
      },
    },
  },
  {
    plugins: {
      vitest,
    },
    rules: {
      ...vitest.configs.recommended.rules,
    },
  },
  comments.recommended,
  prettierRecommended,

  {
    // Ignore json files for these rules, since theyre not built for them at all.
    // Otherwise, we'll get a bunch of errors on json files that make no sense.
    files: ["!**/*.json"],

    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: import.meta.dirname,
      },
    },

    rules: {
      "no-warning-comments": "error",
      "no-console": "error",
      "no-useless-rename": "error",
      yoda: ["error", "never"],
      "require-unicode-regexp": "error",
      radix: ["error", "always"],
      "prefer-template": "error",
      "prefer-spread": "error",
      "prefer-rest-params": "error",
      "prefer-regex-literals": "error",
      "prefer-promise-reject-errors": "error",
      "prefer-object-spread": "error",
      "prefer-object-has-own": "error",
      "prefer-numeric-literals": "error",
      "prefer-named-capture-group": "error",
      "prefer-const": ["error", { ignoreReadBeforeAssign: true }],
      "prefer-arrow-callback": ["error", { allowNamedFunctions: true }],
      "operator-assignment": ["error", "never"],
      "logical-assignment-operators": ["error", "never"],
      "one-var": ["error", "never"],
      "object-shorthand": ["error", "always"],
      "no-void": "error",
      "no-var": "error",
      "no-useless-return": "error",
      "no-useless-constructor": "error",
      "no-useless-concat": "error",
      "no-useless-computed-key": "error",
      "no-useless-call": "error",
      "no-unused-expressions": "error",
      "no-unneeded-ternary": "error",
      "no-throw-literal": "error",
      "no-sequences": "error",
      "no-script-url": "error",
      "no-return-assign": "error",
      "no-proto": "error",
      "no-object-constructor": "error",
      "no-dupe-class-members": "error",
      "no-new-wrappers": "error",
      "no-new-func": "error",
      "no-new": "error",
      "no-negated-condition": "error",
      "no-multi-assign": "error",
      "no-loop-func": "error",
      "no-lonely-if": "error",
      "no-lone-blocks": "error",
      "no-labels": "error",
      "no-iterator": "error",
      "no-invalid-this": "error",
      "no-implied-eval": "error",
      "no-implicit-globals": "error",
      "no-implicit-coercion": "error",
      "no-extra-bind": "error",
      "no-extend-native": "error",
      "no-eval": "error",
      "no-eq-null": "error",
      "no-empty-function": "error",
      "no-else-return": ["error", { allowElseIf: false }],
      "no-bitwise": "error",
      "no-array-constructor": "error",
      "new-cap": ["error", { capIsNew: false }],
      "guard-for-in": "error",
      "func-style": ["error", "declaration", { allowArrowFunctions: true }],
      "func-names": ["error", "always", { generators: "never" }],
      "func-name-matching": "error",
      eqeqeq: ["error", "always"],
      "dot-notation": "error",
      "default-case-last": "error",
      "default-case": "error",
      curly: ["error", "all"],
      "consistent-this": ["error", "self"],
      "capitalized-comments": [
        "error",
        "always",
        {
          ignoreConsecutiveComments: true,
        },
      ],
      camelcase: ["error", { properties: "never" }],
      "arrow-body-style": ["error", "as-needed"],
      "require-atomic-updates": "error",
      "no-useless-assignment": "error",
      "no-unreachable-loop": "error",
      "no-unmodified-loop-condition": "error",
      "no-template-curly-in-string": "error",
      "no-self-compare": "error",
      "no-promise-executor-return": "error",
      "no-constructor-return": "error",
      "no-await-in-loop": "error",
      "array-callback-return": "error",

      "@eslint-community/eslint-comments/no-unused-disable": "error",

      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "error",
      "@typescript-eslint/strict-boolean-expressions": "error",
      "@typescript-eslint/no-unnecessary-template-expression": "error",
      "@typescript-eslint/restrict-template-expressions": [
        "error",
        {
          allowNumber: true,
          allowBoolean: true,
          allowNever: false,
          allowNullish: false,
          allowRegExp: false,
        },
      ],

      "import/first": "error",
      "import/no-absolute-path": "error",
      "import/no-webpack-loader-syntax": "error",
      "import/no-empty-named-blocks": "error",
      "import/no-duplicates": "error",
      "import/newline-after-import": "error",
      "import/no-extraneous-dependencies": "error",
      "import/no-unresolved": "error",
      "import/no-self-import": "error",
      "import/no-dynamic-require": "error",
      "import/consistent-type-specifier-style": ["error", "prefer-top-level"],
      "import/no-relative-packages": "error",
      "import/order": [
        "error",
        {
          "newlines-between": "never",
        },
      ],
      "import/no-useless-path-segments": [
        "error",
        {
          noUselessIndex: true,
        },
      ],
      "sort-imports": [
        "error",
        {
          ignoreDeclarationSort: true,
        },
      ],

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Ban `<package>/index` imports (e.g. `effect/index`).
              // The negative lookahead allows relative imports (`./index`,
              // `../foo/index`) which TypeScript resolves natively.
              regex: String.raw`^(?!\.).+/index$`,
              message:
                "Don't import a package's '/index' path directly — import the package root instead (e.g. `effect`, not `effect/index`).",
            },
          ],
        },
      ],

      "unicorn/consistent-existence-index-check": ["off"],
      "unicorn/no-array-callback-reference": ["off"],
      "unicorn/no-array-method-this-argument": ["off"],
      "unicorn/consistent-function-scoping": ["off"],
      "unicorn/no-keyword-prefix": ["off"],
      "unicorn/no-null": ["off"],
      "unicorn/no-useless-undefined": [
        "error",
        {
          checkArguments: false,
          checkArrowFunctionBody: false,
        },
      ],
      "unicorn/no-array-sort": ["off"],
      "unicorn/no-array-reduce": ["off"],
      "unicorn/no-array-for-each": ["off"],
      "unicorn/throw-new-error": ["off"],
      "unicorn/prevent-abbreviations": [
        "error",
        {
          replacements: {
            db: {
              database: false,
            },

            e: {
              event: false,
              evt: true,
            },

            evt: {
              event: false,
            },

            param: {
              parameter: false,
            },

            params: {
              parameters: false,
            },

            props: {
              properties: false,
            },

            ref: {
              reference: false,
            },

            refs: {
              references: false,
            },

            utils: {
              utilities: false,
            },
          },
        },
      ],
      "unicorn/filename-case": [
        "error",
        {
          cases: {
            camelCase: true,
            pascalCase: true,
          },

          ignore: ["URL", "DB"],
        },
      ],
      "unicorn/custom-error-definition": ["off"], // Conflicts with Effect's Data.Error constructors

      "vitest/consistent-test-it": [
        "error",
        {
          fn: "test",
        },
      ],
      "vitest/no-hooks": [
        "error",
        {
          allow: ["beforeEach", "afterEach"],
        },
      ],
      "vitest/require-top-level-describe": [
        "error",
        {
          maxNumberOfTopLevelDescribes: 1,
        },
      ],
      "vitest/prefer-lowercase-title": [
        "error",
        {
          ignore: ["describe"],
        },
      ],
      "vitest/require-hook": [
        "error",
        {
          allowedFunctionCalls: [...EFFECT_TEST_FUNCTION_NAMES],
        },
      ],
      "vitest/no-standalone-expect": [
        "error",
        {
          additionalTestBlockFunctions: [...EFFECT_TEST_FUNCTION_NAMES],
        },
      ],
      "vitest/prefer-expect-assertions": [
        "warn",
        {
          onlyFunctionsWithAsyncKeyword: true,
        },
      ],
      "vitest/max-expects": ["off"],
    },
  },

  // Rule overrides for tests
  {
    files: ["**/*.test.ts"],
    rules: {
      "import/no-extraneous-dependencies": [
        "error",
        {
          devDependencies: true,
        },
      ],
    },
  },

  // Rule overrides for config files (import devDependencies freely)
  {
    files: ["*.ts"],
    rules: {
      "import/no-extraneous-dependencies": "off",
    },
  },

  // Package.json linting (must come after configs that exclude JSON files)
  packageJson.configs.recommended,
  packageJson.configs.stylistic,
]);

export default config;

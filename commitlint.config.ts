import type { RuleConfigSeverity, UserConfig } from "@commitlint/types";

// Bot commits (Renovate, changesets) can exceed the conventional limit, so we
// raise it here.
const MAX_BODY_LINE_LENGTH = 200;

const commitlintConfig: UserConfig = {
  extends: ["@commitlint/config-conventional"],

  rules: {
    "body-max-line-length": [
      2 satisfies RuleConfigSeverity.Error,
      "always",
      MAX_BODY_LINE_LENGTH,
    ],
  },
};

export default commitlintConfig;

import oxfmtConfig from "@timche/oxc-configs/oxfmt";
import oxlintConfig from "@timche/oxc-configs/oxlint";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ...oxfmtConfig,
    ignorePatterns: ["**/dist/**"],
  },
  lint: {
    ...oxlintConfig,
    ignorePatterns: ["**/dist/**"],
    options: { ...oxlintConfig.options, typeCheck: true },
  },
  staged: {
    "*": "vp check --fix",
  },
});

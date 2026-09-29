import oxfmtConfig from "@timche/oxc-configs/oxfmt";
import { defineConfig } from "vite-plus";

export default defineConfig({
  fmt: {
    ...oxfmtConfig,
    ignorePatterns: ["**/dist/**"],
  },
});

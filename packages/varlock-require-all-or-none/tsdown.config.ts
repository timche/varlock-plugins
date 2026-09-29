import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/plugin.ts'],
  format: ['cjs'],
  platform: 'node',
  target: 'node22',
  outDir: 'dist',
  deps: { neverBundle: ['varlock'] },
  // varlock executes plugin.cjs itself rather than through require, so a split chunk that
  // required it back would run the entry again outside the plugin context
  outputOptions: { codeSplitting: false },
});

# Contributing

## Setup

Needs [Bun](https://bun.sh) and Node.js 22 or later; the tests run the varlock CLI under Node.

```sh
bun install
bun run typecheck
bun run test      # builds every package, then runs bun test
```

## Layout

One workspace package per plugin, in `packages/<name>`, published as `@timche/<name>`:

- `src/plugin.ts` is the plugin. It imports only types and the `plugin` object from `varlock/plugin-lib`.
- `tsdown.config.ts` builds it into one self-contained `dist/plugin.cjs`. Varlock loads that file directly and installs nothing for it, so any dependency must be bundled; `varlock` itself stays external.
- `test/` loads fixture schemas through the built plugin with the real varlock CLI (see `test/varlock.ts`). Anything that talks to a secret provider uses a stub on `PATH` (see `test/fake-op.ts`), never a real account.

To add a plugin, copy an existing package, rename it, and add it to the root `devDependencies` as `"@timche/<name>": "workspace:*"` so fixtures can load it by name.

## Changes

Run `bun run typecheck` and `bun run test` before opening a pull request; CI runs the same on every push and pull request.

A pull request that changes what a package publishes also needs a changeset, see [RELEASING.md](RELEASING.md).

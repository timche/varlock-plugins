# Contributing

## Setup

`mise.toml` pins Node and pnpm; `mise install` sets them up. The tests run on Vitest and start the varlock CLI with Node.

```sh
pnpm install
pnpm check        # format, lint and type checks through Vite+; `pnpm fix` applies fixes
pnpm test         # builds every package, then runs vp test
```

## Layout

One workspace package per plugin, in `packages/<name>`, published as `@timche/<name>`:

- `src/plugin.ts` is the plugin. It imports only types and the `plugin` object from `varlock/plugin-lib`.
- `vite.config.ts` builds it with `vp pack`, using the shared options in `pack.config.ts`, into one self-contained `dist/plugin.cjs`. Varlock loads that file directly and installs nothing for it, so any dependency must be bundled; `varlock` itself stays external.
- `test/` loads fixture schemas through the built plugin with the real varlock CLI (see `test/varlock.ts`). Anything that talks to a secret provider uses a stub on `PATH` (see `test/fake-op.ts`), never a real account.

To add a plugin, copy an existing package, rename it, and add it to the root `devDependencies` as `"@timche/<name>": "workspace:*"` so fixtures can load it by name.

## Changes

Run `pnpm check` and `pnpm test` before opening a pull request; CI runs the same on every push and pull request.

A pull request that changes what a package publishes also needs a changeset, see [RELEASING.md](RELEASING.md).

`pnpm install` enables a pre-commit hook (`.vite-hooks/pre-commit`) that runs `vp check --fix` on the staged files, so a commit is formatted and fails on lint or type errors.

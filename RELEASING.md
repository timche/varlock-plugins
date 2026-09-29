# Releasing

Versions and changelogs are managed with [Changesets](https://github.com/changesets/changesets), and each package is versioned on its own.

## Day to day

1. In a pull request that changes a package, run `pnpm changeset`, pick the packages and the bump, and commit the file it writes to `.changeset/`.
2. Once that is merged, the Release workflow opens (or updates) a "Release packages" pull request that bumps the versions and writes the changelogs. CI does not run on it, because GitHub starts no workflows for a pull request opened with the workflow's own token; the changes it makes are only versions and changelogs.
3. Merging that pull request publishes every package whose version is not on npm yet, with `pnpm publish` through npm trusted publishing (OIDC) and provenance, and tags the release. No npm token is stored in the repository, and none may be: pnpm prefers a token over OIDC when it finds one.

## Repository settings the Release workflow needs

- The variable `RELEASE_ENABLED` set to `true` (Settings, Secrets and variables, Actions, Variables). The workflow does nothing until then.
- "Allow GitHub Actions to create and approve pull requests" turned on (Settings, Actions, General), so the workflow can open the "Release packages" pull request.

## First publish of a new package

npm only lets a trusted publisher be configured on a package that already exists, so a new package's first version is published by hand, logged in as an owner of the `@timche` scope with a 2FA code at hand:

1. On an up-to-date `main`: `pnpm install && pnpm test`.
2. In the package directory: `npm publish --access public --otp <code>`.
3. Trust the Release workflow to publish it: `npm trust github @timche/<name> --repo timche/varlock-plugins --file release.yml --allow-publish --otp <code>`, or the same on npmjs.com in the package's settings.
4. Require 2FA for publishing and disallow tokens: `npm access set mfa=publish @timche/<name> --otp <code>`.

Until step 3 is done, a Release run on `main` fails to publish that package; re-run it afterwards.

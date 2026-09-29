# Releasing

Versions and changelogs are managed with [Changesets](https://github.com/changesets/changesets), and each package is versioned on its own.

## Day to day

1. In a pull request that changes a package, run `bunx changeset`, pick the packages and the bump, and commit the file it writes to `.changeset/`.
2. Once that is merged, the Release workflow opens (or updates) a "Release packages" pull request that bumps the versions and writes the changelogs.
3. Merging that pull request publishes every package whose version is not on npm yet, through npm trusted publishing (OIDC) with provenance, and tags the release. No npm token is stored in the repository.

## First publish of a new package

npm only lets a trusted publisher be configured on a package that already exists, so a new package's first version is published by hand:

1. On an up-to-date `main`: `bun install && bun run test`.
2. In the package directory: `npm publish --access public`, logged in as an owner of the `@timche` scope.
3. On npmjs.com, in the package's settings, add a trusted publisher: GitHub Actions, repository `timche/varlock-plugins`, workflow `release.yml`.
4. Once every package has one, set the repository variable `RELEASE_ENABLED` to `true` (Settings, Secrets and variables, Actions, Variables). The Release workflow does nothing until then.

Until step 3 is done, a Release run on `main` fails to publish that package; re-run it afterwards.

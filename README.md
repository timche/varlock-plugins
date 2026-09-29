# varlock-plugins

Small [varlock](https://varlock.dev) plugins, each published to npm as its own package so a project loads only what it uses.

| Package                                                                       | Adds                                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| [`@timche/varlock-require-all-or-none`](packages/varlock-require-all-or-none) | `@requireAllOrNone`: fails the load when only some items of a group are set |

## Usage

Install a plugin as a dev dependency next to `varlock`, then load it in your `.env.schema`:

```sh
npm install --save-dev @timche/varlock-require-all-or-none
```

```env-spec
# @plugin(@timche/varlock-require-all-or-none)
# @requireAllOrNone($CLIENT_ID, $CLIENT_SECRET)
# ---
```

Varlock finds an installed plugin by walking up `node_modules` from the schema file. With the standalone binary and no `package.json`, pin an exact version instead, e.g. `@plugin(@timche/varlock-require-all-or-none@0.1.0)`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) and [RELEASING.md](RELEASING.md).

## License

MIT

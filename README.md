# varlock-plugins

Small [varlock](https://varlock.dev) plugins, each published to npm as its own package so a project loads only what it uses.

| Package | Adds |
| --- | --- |
| [`@timche/varlock-skip-if-no-auth`](packages/varlock-skip-if-no-auth) | `skipIfNoAuth()`: a secret resolves to `undefined` when its provider has no credentials, instead of failing the load |
| [`@timche/varlock-require-all-or-none`](packages/varlock-require-all-or-none) | `@requireAllOrNone`: fails the load when only some items of a group are set |

## License

MIT

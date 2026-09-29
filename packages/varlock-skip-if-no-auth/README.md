# @timche/varlock-skip-if-no-auth

A [varlock](https://varlock.dev) plugin adding `skipIfNoAuth()`, a resolver that wraps another one and resolves to `undefined` when the secret provider behind it has no credentials, instead of failing the whole load.

Useful for secrets that only some people or jobs can read, such as signing credentials in a public repository: maintainers get the value, while contributors and CI without access get an unset item and a warning.

## Install

```sh
npm install --save-dev @timche/varlock-skip-if-no-auth
```

## Usage

```env-spec
# @plugin(@varlock/1password-plugin)
# @plugin(@timche/varlock-skip-if-no-auth)
# @initOp(token=$OP_TOKEN, allowAppAuth=true)
# ---
# @type=opServiceAccountToken @internal @optional @sensitive
OP_TOKEN=

# @optional @sensitive
SIGNING_PASSWORD=skipIfNoAuth(op("op://Vault/Item/password"))
```

With a token or a signed-in desktop app, `SIGNING_PASSWORD` resolves as usual. Without either, it resolves to `undefined` and the load prints a warning:

```
🧐 SIGNING_PASSWORD  🔐sensitive
   └ undefined
   - [WARNING] skipped, 1Password is not authenticated: op(): Unable to authenticate with 1Password
```

It also works inside other functions, e.g. `if($SIGN, skipIfNoAuth(op("op://Vault/Item/password")))`.

## What counts as "no credentials"

Only failures that mean no credentials are available at all are skipped. Everything else still fails the load, so a real problem is never hidden:

| Situation                                                                                                    | Result      |
| ------------------------------------------------------------------------------------------------------------ | ----------- |
| No token, and desktop app auth is off                                                                        | `undefined` |
| Desktop app auth is on, but there is no `op` CLI, no desktop app, or its integration is off or was dismissed | `undefined` |
| A token that is rejected                                                                                     | error       |
| An item, field or vault that does not exist                                                                  | error       |
| Any other error                                                                                              | error       |

`skipIfNoAuth()` accepts any expression, but currently recognizes only the errors of [`@varlock/1password-plugin`](https://www.npmjs.com/package/@varlock/1password-plugin). Errors from other providers pass through unchanged.

## Notes

- The provider's plugin must be loaded wherever `op()` appears, even in a branch that never runs; varlock rejects unknown functions when it reads the schema. Load it in every environment and let `skipIfNoAuth()` handle the ones without credentials.
- A `@required` item still fails when its value is skipped, so `@required=forEnv(production)` keeps a release strict.
- The warning is printed on every load without credentials.

## License

MIT

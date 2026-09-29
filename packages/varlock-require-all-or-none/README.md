# @timche/varlock-require-all-or-none

A [varlock](https://varlock.dev) plugin adding `@requireAllOrNone`, a root decorator that fails the load when only some items of a group are set.

Useful for a set of values that is optional as a whole but useless in part, such as the client id, secret and tenant of an optional sign-in provider. Writing each item as `@required=not(isEmpty(...))` of the others is rejected as a dependency cycle, and anchoring on one item only checks one direction.

## Install

```sh
npm install --save-dev @timche/varlock-require-all-or-none
```

## Usage

```env-spec
# @plugin(@timche/varlock-require-all-or-none)
# @requireAllOrNone($CLIENT_ID, $CLIENT_SECRET, $TENANT_ID)
# @requireAllOrNone($SMTP_HOST, $SMTP_PASSWORD)
# ---
# @optional
CLIENT_ID=
# @optional @sensitive
CLIENT_SECRET=
# @optional
TENANT_ID=
# @optional
SMTP_HOST=
# @optional @sensitive
SMTP_PASSWORD=
```

Setting none or all of a group passes. Setting some fails the load, naming what is missing and what is set:

```
- ❌ CLIENT_SECRET must be set because CLIENT_ID and TENANT_ID are set
  Set all of CLIENT_ID, CLIENT_SECRET and TENANT_ID, or none of them
```

## Rules

- An item is set when its resolved value is neither `undefined` nor an empty string. `0` and `false` count as set.
- Use it once per group; each group is checked on its own, and one item may belong to several groups.
- Each argument must be an item reference (`$KEY`), with at least 2 different items.
- An item that fails to resolve on its own reports its own error, and its group is not checked.
- The items keep their own `@optional` or `@required`, so generated types do not change.

## Ordering

Varlock resolves the items of a root decorator when it reaches that decorator in the header. If an item's value comes from a plugin that is initialized by another root decorator, such as `op()` after `@initOp`, put `@requireAllOrNone` after it:

```env-spec
# @plugin(@varlock/1password-plugin)
# @plugin(@timche/varlock-require-all-or-none)
# @initOp(token=$OP_TOKEN)
# @requireAllOrNone($CLIENT_ID, $CLIENT_SECRET)
```

## License

MIT

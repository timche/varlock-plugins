import { plugin, type Resolver } from "varlock/plugin-lib";

const { SchemaError } = plugin.ERRORS;

plugin.name = "skip-if-no-auth";
plugin.icon = "mdi:lock-off-outline";

// Only errors that mean "no credentials are available at all" are listed. A credential that is
// present but rejected, or a reference that does not exist, must keep failing the load.
const NO_AUTH_ERRORS: Array<{ provider: string; pattern: RegExp }> = [
  // no token, no Connect server, and desktop app auth not allowed
  { provider: "1Password", pattern: /Unable to authenticate with 1Password/ },
  // desktop app auth allowed, but the machine has no `op` CLI
  { provider: "1Password", pattern: /1Password CLI `op` not found/ },
  // desktop app auth allowed, but no desktop app is running to connect to
  { provider: "1Password", pattern: /couldn't connect to the 1Password desktop app/ },
  // the desktop app integration was dismissed or is turned off
  { provider: "1Password", pattern: /1Password CLI not configured/ },
  { provider: "1Password", pattern: /authorization prompt dismissed/ },
  { provider: "1Password", pattern: /You are not currently signed in/ },
  { provider: "1Password", pattern: /No accounts configured for use with 1Password CLI/ },
];

function findNoAuthProvider(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  return NO_AUTH_ERRORS.find(({ pattern }) => pattern.test(message))?.provider;
}

plugin.registerResolverFunction({
  name: "skipIfNoAuth",
  label: "Resolve to undefined when the secret provider has no credentials",
  icon: "mdi:lock-off-outline",
  argsSchema: {
    type: "array",
    arrayExactLength: 1,
  },
  process() {
    return this.arrArgs![0];
  },
  async resolve(inner: Resolver) {
    try {
      return await inner.resolve();
    } catch (err) {
      const provider = findNoAuthProvider(err);
      if (!provider) throw err;
      const reason = err instanceof Error ? err.message : String(err);
      const message = `skipped, ${provider} is not authenticated: ${reason}`;
      // a value can be resolved more than once in a load, and the warning should not repeat
      if (!this._errors.some((e) => e.message === message)) {
        this._errors.push(new SchemaError(message, { isWarning: true }));
      }
      return undefined;
    }
  },
});

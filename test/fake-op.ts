import { chmodSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const VALID_TOKEN = "ops_valid-test-token";

// Messages are copied from the real `op` 2.x CLI, since the plugin under test tells
// "no credentials" apart from other failures by what `op` prints.
export const DESKTOP_APP_UNAVAILABLE =
  "error initializing client: connecting to desktop app: 1Password CLI couldn't connect to the 1Password desktop app.";

const script = (secrets: Record<string, string>, noAuthMessage: string) => `
const fs = require('node:fs');
const secrets = ${JSON.stringify(secrets)};
const fail = (msg) => {
  if (msg) process.stderr.write('[ERROR] 2026/01/01 00:00:00 ' + msg + '\\n');
  process.exit(1);
};
const args = process.argv.slice(2);
if (args[0] !== 'inject') fail('unknown command "' + args[0] + '" for "op"');
const token = process.env.OP_SERVICE_ACCOUNT_TOKEN;
if (!token) fail(${JSON.stringify(noAuthMessage)});
if (token !== ${JSON.stringify(VALID_TOKEN)}) fail('error initializing client: Validation: (failed to session.DecodeSACredentials), Server: (failed to DecodeSACredentials), illegal base64 data at input byte 4');
const template = fs.readFileSync(args[args.indexOf('-i') + 1], 'utf8');
const output = template.replace(/\\{\\{\\s*(op:\\/\\/[^}]+?)\\s*\\}\\}/g, (_, ref) => {
  if (ref in secrets) return secrets[ref];
  const [vault, item] = ref.slice('op://'.length).split('/');
  fail('could not resolve item UUID for item ' + item + ': could not find item ' + item + ' in vault ' + vault);
});
process.stdout.write(output + '\\n');
`;

/**
 * Creates a directory holding a fake `op` executable, to put on PATH. Without a token it
 * fails with `noAuthMessage`, the way `op` does when desktop app auth is unavailable.
 */
export function createFakeOp(
  secrets: Record<string, string>,
  noAuthMessage = DESKTOP_APP_UNAVAILABLE,
) {
  const dir = mkdtempSync(path.join(tmpdir(), "fake-op-"));
  const scriptPath = path.join(dir, "fake-op.cjs");
  writeFileSync(scriptPath, script(secrets, noAuthMessage));
  const opPath = path.join(dir, "op");
  writeFileSync(opPath, `#!/bin/sh\nexec "${process.execPath}" "${scriptPath}" "$@"\n`);
  chmodSync(opPath, 0o755);
  process.on("exit", () => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

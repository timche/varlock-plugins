import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const VARLOCK_CLI = path.join(import.meta.dir, '..', 'node_modules', 'varlock', 'bin', 'cli.js');
// the CLI switches to Bun when it detects a Bun parent, so it is started with Node explicitly
const NODE = Bun.which('node');
if (!NODE) throw new Error('node must be on PATH to run varlock');

export type LoadResult = {
  ok: boolean,
  values: Record<string, unknown>,
  output: string,
};

export function loadSchema(
  fixtureDir: string,
  opts: { env?: Record<string, string>, path?: string, format?: 'json' | 'pretty' } = {},
): LoadResult {
  const home = mkdtempSync(path.join(tmpdir(), 'varlock-home-'));
  const result = spawnSync(NODE!, [VARLOCK_CLI, 'load', '--format', opts.format ?? 'json'], {
    cwd: fixtureDir,
    encoding: 'utf8',
    env: {
      // no ambient PATH, so a real `op` on the machine can never be reached
      PATH: opts.path ?? '/usr/bin:/bin',
      HOME: home,
      XDG_CONFIG_HOME: path.join(home, '.config'),
      NO_COLOR: '1',
      VARLOCK_TELEMETRY_DISABLED: '1',
      ...opts.env,
    },
  });
  rmSync(home, { recursive: true, force: true });
  const ok = result.status === 0;
  return {
    ok,
    values: ok && opts.format !== 'pretty' ? JSON.parse(result.stdout) : {},
    output: `${result.stdout}\n${result.stderr}`,
  };
}

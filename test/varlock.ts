import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const VARLOCK_CLI = path.resolve(import.meta.dirname, "../node_modules/varlock/bin/cli.js");

function parseValues(stdout: string): Record<string, unknown> {
  const parsed: unknown = JSON.parse(stdout);
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`expected a JSON object, got ${stdout}`);
  }
  return Object.fromEntries(Object.entries(parsed));
}

export type LoadResult = {
  ok: boolean;
  values: Record<string, unknown>;
  output: string;
};

export function loadSchema(
  fixtureDir: string,
  opts: { env?: Record<string, string>; path?: string; format?: "json" | "pretty" } = {},
): LoadResult {
  const home = mkdtempSync(path.join(tmpdir(), "varlock-home-"));
  const result = spawnSync(
    process.execPath,
    [VARLOCK_CLI, "load", "--format", opts.format ?? "json"],
    {
      cwd: fixtureDir,
      encoding: "utf8",
      env: {
        // no ambient PATH, so a real `op` on the machine can never be reached
        PATH: opts.path ?? "/usr/bin:/bin",
        HOME: home,
        XDG_CONFIG_HOME: path.join(home, ".config"),
        NO_COLOR: "1",
        VARLOCK_TELEMETRY_DISABLED: "1",
        ...opts.env,
      },
    },
  );
  rmSync(home, { recursive: true, force: true });
  const ok = result.status === 0;
  return {
    ok,
    values: ok && opts.format !== "pretty" ? parseValues(result.stdout) : {},
    output: `${result.stdout}\n${result.stderr}`,
  };
}

import { describe, expect, test } from "bun:test";
import path from "node:path";
import { createFakeOp, DESKTOP_APP_UNAVAILABLE, VALID_TOKEN } from "../../../test/fake-op";
import { loadSchema } from "../../../test/varlock";

const fixture = (name: string) => path.join(import.meta.dir, "fixtures", name);

const API_KEY = "acme-api-key-0123456789";
const SIGNING_KEY = "signing-key-0123456789";
const fakeOpDir = createFakeOp({
  "op://Shared/Acme API/credential": API_KEY,
  "op://Shared/Signing/password": SIGNING_KEY,
});
const withFakeOp = `${fakeOpDir}:/usr/bin:/bin`;

describe("without credentials", () => {
  test("an unwrapped op() fails the load even when optional", () => {
    const result = loadSchema(fixture("unwrapped"), { path: withFakeOp });
    expect(result.ok).toBe(false);
    expect(result.output).toContain("Unable to authenticate with 1Password");
  });

  test("no token and app auth off resolves to undefined", () => {
    const result = loadSchema(fixture("basic"), { path: withFakeOp });
    expect(result.ok).toBe(true);
    expect(result.values).not.toHaveProperty("API_KEY");
  });

  test("warns that the value was skipped", () => {
    const result = loadSchema(fixture("basic"), { path: withFakeOp, format: "pretty" });
    expect(result.ok).toBe(true);
    expect(result.output).toContain("skipped, 1Password is not authenticated");
  });

  test.each([
    DESKTOP_APP_UNAVAILABLE,
    "No accounts configured for use with 1Password CLI.",
    "You are not currently signed in. Please run `op signin --help` for instructions",
    "authorization prompt dismissed, please try again",
    "",
  ])("app auth where op fails with %p resolves to undefined", (message) => {
    const result = loadSchema(fixture("basic"), {
      path: `${createFakeOp({}, message)}:/usr/bin:/bin`,
      env: { OP_APP_AUTH: "true" },
    });
    expect(result.ok).toBe(true);
    expect(result.values).not.toHaveProperty("API_KEY");
  });

  test("app auth with no op CLI resolves to undefined", () => {
    const result = loadSchema(fixture("basic"), { env: { OP_APP_AUTH: "true" } });
    expect(result.ok).toBe(true);
    expect(result.values).not.toHaveProperty("API_KEY");
  });

  test("inside a taken if() branch resolves to undefined", () => {
    const result = loadSchema(fixture("basic"), { path: withFakeOp, env: { SIGN: "true" } });
    expect(result.ok).toBe(true);
    expect(result.values).not.toHaveProperty("SIGNING_KEY");
  });

  test("a required item still fails", () => {
    const result = loadSchema(fixture("required"), { path: withFakeOp });
    expect(result.ok).toBe(false);
    expect(result.output).toContain("API_KEY");
  });
});

describe("with credentials", () => {
  test("resolves the value", () => {
    const result = loadSchema(fixture("basic"), {
      path: withFakeOp,
      env: { OP_TOKEN: VALID_TOKEN, SIGN: "true" },
    });
    expect(result.ok).toBe(true);
    expect(result.values).toMatchObject({ API_KEY, SIGNING_KEY });
  });

  test("a wrong token fails the load", () => {
    const result = loadSchema(fixture("basic"), {
      path: withFakeOp,
      env: { OP_TOKEN: "ops_wrong-test-token" },
    });
    expect(result.ok).toBe(false);
    expect(result.output).toContain("DecodeSACredentials");
  });

  test("a missing item fails the load", () => {
    const result = loadSchema(fixture("missing-item"), {
      path: withFakeOp,
      env: { OP_TOKEN: VALID_TOKEN },
    });
    expect(result.ok).toBe(false);
    expect(result.output).toContain('1Password item "Does Not Exist" not found');
  });
});

test("needs exactly one argument", () => {
  const result = loadSchema(fixture("no-args"));
  expect(result.ok).toBe(false);
  expect(result.output).toContain("skipIfNoAuth(): expects exactly 1 argument");
});

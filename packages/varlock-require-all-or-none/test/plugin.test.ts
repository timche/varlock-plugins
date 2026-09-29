import { describe, expect, test } from "bun:test";
import path from "node:path";
import { createFakeOp, VALID_TOKEN } from "../../../test/fake-op";
import { loadSchema } from "../../../test/varlock";

const fixture = (name: string) => path.join(import.meta.dir, "fixtures", name);
const loadGroups = (env: Record<string, string>) => loadSchema(fixture("groups"), { env });

const CLIENT = { CLIENT_ID: "client-id", CLIENT_SECRET: "client-secret", TENANT_ID: "tenant-id" };
const SMTP = { SMTP_HOST: "smtp.example.com", SMTP_PASSWORD: "x".repeat(16), SMTP_PORT: "587" };

describe("passes", () => {
  test("when no item of any group is set", () => {
    const result = loadGroups({});
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({});
  });

  test("when every item of a group is set", () => {
    const result = loadGroups(CLIENT);
    expect(result.ok).toBe(true);
    expect(result.values).toEqual(CLIENT);
  });

  test("when every group is complete", () => {
    const result = loadGroups({ ...CLIENT, ...SMTP });
    expect(result.ok).toBe(true);
    expect(result.values).toEqual({ ...CLIENT, ...SMTP, SMTP_PORT: 587 });
  });

  test("when a value is 0, which counts as set", () => {
    const result = loadGroups({ ...SMTP, SMTP_PORT: "0" });
    expect(result.ok).toBe(true);
  });
});

describe("fails", () => {
  test("when only the first item is set", () => {
    const result = loadGroups({ CLIENT_ID: CLIENT.CLIENT_ID });
    expect(result.ok).toBe(false);
    expect(result.output).toContain(
      "CLIENT_SECRET and TENANT_ID must be set because CLIENT_ID is set",
    );
  });

  test("when only the last item is set", () => {
    const result = loadGroups({ TENANT_ID: CLIENT.TENANT_ID });
    expect(result.ok).toBe(false);
    expect(result.output).toContain(
      "CLIENT_ID and CLIENT_SECRET must be set because TENANT_ID is set",
    );
  });

  test("when one item is missing", () => {
    const result = loadGroups({ CLIENT_ID: CLIENT.CLIENT_ID, TENANT_ID: CLIENT.TENANT_ID });
    expect(result.ok).toBe(false);
    expect(result.output).toContain(
      "CLIENT_SECRET must be set because CLIENT_ID and TENANT_ID are set",
    );
  });

  test("when an item is set to an empty string", () => {
    const result = loadGroups({ ...CLIENT, CLIENT_SECRET: "" });
    expect(result.ok).toBe(false);
    expect(result.output).toContain(
      "CLIENT_SECRET must be set because CLIENT_ID and TENANT_ID are set",
    );
  });

  test("for the incomplete group only, when another is complete", () => {
    const result = loadGroups({ ...CLIENT, SMTP_HOST: SMTP.SMTP_HOST });
    expect(result.ok).toBe(false);
    expect(result.output).toContain(
      "SMTP_PASSWORD and SMTP_PORT must be set because SMTP_HOST is set",
    );
    expect(result.output).not.toContain("because CLIENT_ID");
  });

  test("for each incomplete group", () => {
    const result = loadGroups({ CLIENT_SECRET: CLIENT.CLIENT_SECRET, SMTP_PORT: SMTP.SMTP_PORT });
    expect(result.ok).toBe(false);
    expect(result.output).toContain(
      "CLIENT_ID and TENANT_ID must be set because CLIENT_SECRET is set",
    );
    expect(result.output).toContain(
      "SMTP_HOST and SMTP_PASSWORD must be set because SMTP_PORT is set",
    );
  });
});

describe("rejects the schema", () => {
  test("when an argument is not an item reference", () => {
    const result = loadSchema(fixture("not-a-ref"));
    expect(result.ok).toBe(false);
    expect(result.output).toContain("arguments must be item references like $CLIENT_ID");
  });

  test("when it lists fewer than 2 items", () => {
    const result = loadSchema(fixture("one-item"));
    expect(result.ok).toBe(false);
    expect(result.output).toContain("needs at least 2 items");
  });

  test("when an item is listed twice", () => {
    const result = loadSchema(fixture("duplicate"));
    expect(result.ok).toBe(false);
    expect(result.output).toContain("CLIENT_ID is listed twice");
  });

  test("when an item does not exist", () => {
    const result = loadSchema(fixture("unknown-item"));
    expect(result.ok).toBe(false);
    expect(result.output).toContain("CLIENT_SECERT");
  });
});

test("checks items that resolve through a plugin initialized before it", () => {
  const fakeOpDir = createFakeOp({ "op://Shared/Acme API/credential": "client-secret-0123456789" });
  const run = (env: Record<string, string>) =>
    loadSchema(fixture("order"), {
      path: `${fakeOpDir}:/usr/bin:/bin`,
      env: { OP_TOKEN: VALID_TOKEN, ...env },
    });
  expect(run({ CLIENT_ID: "client-id" }).ok).toBe(true);
  expect(run({ CLIENT_ID: "client-id", CLIENT_SECRET: "" }).output).toContain(
    "CLIENT_SECRET must be set because CLIENT_ID is set",
  );
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatTokenDate, getAccessTokenPayload } from "./session";
import { getAccessToken } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

function encodePayload(payload: object): string {
  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
}

describe("session helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("decodes base64url JWT payloads", () => {
    const payload = {
      token_type: "access",
      user_id: 42,
      role: "PARENT",
      name: "Łukasz",
    };

    vi.mocked(getAccessToken).mockReturnValue(`header.${encodePayload(payload)}.signature`);

    expect(getAccessTokenPayload()).toEqual(payload);
  });

  it("returns null when the token is missing or invalid", () => {
    vi.mocked(getAccessToken).mockReturnValue(undefined);
    expect(getAccessTokenPayload()).toBeNull();

    vi.mocked(getAccessToken).mockReturnValue("invalid-token");
    expect(getAccessTokenPayload()).toBeNull();
  });

  it("formats empty token dates as missing data", () => {
    expect(formatTokenDate()).toBe("Brak danych");
  });
});

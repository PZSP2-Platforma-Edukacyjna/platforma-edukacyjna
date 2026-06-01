import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch, apiPost, ApiError } from "./api";
import { getAccessToken } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

describe("api helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000/";
    vi.mocked(getAccessToken).mockReturnValue("access-token");
  });

  it("apiGet sends the access token and returns parsed JSON", async () => {
    const responseBody = { id: 1, name: "Matematyka" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody),
    });

    await expect(apiGet("/api/courses/")).resolves.toEqual(responseBody);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/courses/",
      expect.objectContaining({ headers: expect.any(Headers) }),
    );

    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("apiGet fails before fetch when backend URL is missing", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "";
    global.fetch = vi.fn();

    await expect(apiGet("/api/courses/")).rejects.toMatchObject({
      name: "ApiError",
      message: "Brak adresu backendu w NEXT_PUBLIC_BACKEND_URL.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("apiGet exposes response status in ApiError", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
    });

    await expect(apiGet("/api/manage/students/")).rejects.toEqual(
      new ApiError("Nie udało się pobrać danych (403).", 403),
    );
  });

  it("apiPost sends JSON body with authorization header", async () => {
    const responseBody = { id: 10, body: "Dzień dobry" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody),
    });

    await expect(
      apiPost("/api/users/messages/", { recipient: 5, body: "Dzień dobry" }),
    ).resolves.toEqual(responseBody);

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/users/messages/",
      expect.objectContaining({
        method: "POST",
        headers: expect.any(Headers),
        body: JSON.stringify({ recipient: 5, body: "Dzień dobry" }),
      }),
    );

    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });

  it("apiPost fails before fetch when backend URL is missing", async () => {
    process.env.NEXT_PUBLIC_BACKEND_URL = "";
    global.fetch = vi.fn();

    await expect(apiPost("/api/users/messages/", { body: "Test" })).rejects.toMatchObject({
      name: "ApiError",
      message: "Brak adresu backendu w NEXT_PUBLIC_BACKEND_URL.",
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("apiPost exposes response status in ApiError", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("Bad request"),
    });

    await expect(apiPost("/api/users/messages/", { body: "" })).rejects.toEqual(
      new ApiError("Błąd zapisu danych: 400 Bad request", 400),
    );
  });

  it("apiPatch sends JSON body with authorization header", async () => {
    const responseBody = { id: 7, status: "COMPLETED" };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody),
    });

    await expect(apiPatch("/api/payments/7/", { status: "COMPLETED" })).resolves.toEqual(
      responseBody,
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:8000/api/payments/7/",
      expect.objectContaining({
        method: "PATCH",
        headers: expect.any(Headers),
        body: JSON.stringify({ status: "COMPLETED" }),
      }),
    );

    const headers = vi.mocked(fetch).mock.calls[0][1]?.headers as Headers;
    expect(headers.get("Content-Type")).toBe("application/json");
    expect(headers.get("Authorization")).toBe("Bearer access-token");
  });
});

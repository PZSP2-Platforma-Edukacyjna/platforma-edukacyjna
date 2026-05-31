import { describe, it, expect, vi, beforeEach } from "vitest";
import * as auth from "./auth";
import Cookies from "js-cookie";

// Mock js-cookie
vi.mock("js-cookie", () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  },
}));

describe("auth lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset process.env
    process.env.NEXT_PUBLIC_BACKEND_URL = "http://localhost:8000";
  });

  describe("getUserRole", () => {
    it("returns null if no token is present", () => {
      vi.mocked(Cookies.get).mockReturnValue(undefined);
      expect(auth.getUserRole()).toBeNull();
    });

    it("returns the role from a valid JWT", () => {
      // Create a mock JWT (header.payload.signature)
      // payload = {"role": "TEACHER"}
      const payload = btoa(JSON.stringify({ role: "TEACHER" }));
      const mockToken = `header.${payload}.signature`;

      vi.mocked(Cookies.get).mockReturnValue(mockToken);

      expect(auth.getUserRole()).toBe("TEACHER");
    });

    it("returns null for an invalid JWT", () => {
      vi.mocked(Cookies.get).mockReturnValue("invalid.token");
      expect(auth.getUserRole()).toBeNull();
    });
  });

  describe("logout", () => {
    it("removes access and refresh tokens", () => {
      auth.logout();
      expect(Cookies.remove).toHaveBeenCalledWith("access_token");
      expect(Cookies.remove).toHaveBeenCalledWith("refresh_token");
    });
  });

  describe("login", () => {
    it("sets cookies and returns true on successful login", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({ access: "access_val", refresh: "refresh_val" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await auth.login("test@example.com", "password");

      expect(result).toBe(true);
      expect(Cookies.set).toHaveBeenCalledWith("access_token", "access_val", { expires: 1 });
      expect(Cookies.set).toHaveBeenCalledWith("refresh_token", "refresh_val", { expires: 7 });
    });

    it("returns false on failed login", async () => {
      const mockResponse = {
        ok: false,
        json: async () => ({ error: "Unauthorized" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await auth.login("test@example.com", "wrong");

      expect(result).toBe(false);
      expect(Cookies.set).not.toHaveBeenCalled();
    });
  });
});

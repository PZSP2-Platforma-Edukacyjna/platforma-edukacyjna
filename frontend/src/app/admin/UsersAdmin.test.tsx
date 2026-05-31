import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UsersAdmin from "./UsersAdmin";
import { getAccessToken } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

describe("UsersAdmin", () => {
  const mockUsers = [
    { id: 1, email: "test@example.com", first_name: "John", last_name: "Doe", role: "PARENT" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue("mock-token");

    // mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockUsers),
      }),
    ) as any;
  });

  it("renders users list", async () => {
    render(<UsersAdmin />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Lista Użytkowników")).toBeInTheDocument();
    });

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("allows adding a new user", async () => {
    render(<UsersAdmin />);

    await waitFor(() => expect(screen.getByText("Dodaj Użytkownika")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("Email"), {
      target: { value: "new@example.com" },
    });
    fireEvent.change(screen.getByPlaceholderText("Imię"), { target: { value: "Jane" } });
    fireEvent.change(screen.getByPlaceholderText("Nazwisko"), { target: { value: "Smith" } });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "TEACHER" } });
    fireEvent.change(screen.getByPlaceholderText("Hasło"), { target: { value: "password123" } });

    const submitBtn = screen.getByRole("button", { name: "Dodaj" });

    // mock successful post
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as any);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/users/manage/"),
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("new@example.com"),
        }),
      );
    });
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet } from "@/lib/api";
import MessagesList from "./MessagesList";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

describe("MessagesList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads latest messages from backend instead of static placeholders", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        id: 1,
        sender_name: "Anna Nowak",
        recipient_name: "Parent User",
        body: "Starsza wiadomość",
        created_at: "2026-06-01T09:00:00Z",
        is_mine: false,
      },
      {
        id: 2,
        sender_name: "Parent User",
        recipient_name: "Anna Nowak",
        body: "Nowa wiadomość z rozmowy",
        created_at: "2026-06-01T12:00:00Z",
        is_mine: true,
      },
    ]);

    render(<MessagesList />);

    expect(apiGet).toHaveBeenCalledWith("/api/users/messages/");
    expect(await screen.findByText("Nowa wiadomość z rozmowy")).toBeInTheDocument();
    expect(screen.getByText("Ty do Anna Nowak")).toBeInTheDocument();
    expect(screen.queryByText("Sprawdzian z fizyki w piątek")).not.toBeInTheDocument();
  });

  it("shows an empty state when backend returns no messages", async () => {
    vi.mocked(apiGet).mockResolvedValue([]);

    render(<MessagesList />);

    expect(
      await screen.findByText("Brak wiadomości. Nowe rozmowy pojawią się tutaj po wysłaniu."),
    ).toBeInTheDocument();
    expect(screen.queryByText("Sprawdzian z fizyki w piątek")).not.toBeInTheDocument();
  });

  it("keeps fallback messages only when backend cannot be reached", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Backend unavailable"));

    render(<MessagesList />);

    expect(await screen.findByText("Sprawdzian z fizyki w piątek")).toBeInTheDocument();
  });
});

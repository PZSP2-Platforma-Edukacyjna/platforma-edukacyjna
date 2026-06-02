import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewsList from "./NewsList";
import { apiGet } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

describe("NewsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads announcements from backend", async () => {
    vi.mocked(apiGet).mockResolvedValue([
      {
        id: 1,
        title: "Dzień otwarty",
        body: "Zapraszamy rodziców i uczniów.",
        image_url: "",
        date: "2026-06-01T10:00:00Z",
      },
    ]);

    render(<NewsList />);

    expect(apiGet).toHaveBeenCalledWith("/api/announcements/");
    expect(await screen.findByText("Dzień otwarty")).toBeInTheDocument();
    expect(screen.getByText("Zapraszamy rodziców i uczniów.")).toBeInTheDocument();
  });

  it("keeps fallback news when backend fails", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Backend unavailable"));

    render(<NewsList />);

    expect(await screen.findByText("Nowa wycieczka szkolna")).toBeInTheDocument();
    expect(
      screen.getByText("Dodano materiały z Google Drive do ostatnich lekcji."),
    ).toBeInTheDocument();
  });
});

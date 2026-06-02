import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AnnouncementsAdmin from "./AnnouncementsAdmin";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiDelete: vi.fn(),
  apiGet: vi.fn(),
  apiPatch: vi.fn(),
  apiPost: vi.fn(),
}));

describe("AnnouncementsAdmin", () => {
  const announcements = [
    {
      id: 1,
      title: "Wycieczka szkolna",
      body: "Zapisy są już dostępne.",
      image_url: "https://example.com/trip.jpg",
      date: "2026-06-01T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
    vi.mocked(apiGet).mockResolvedValue(announcements);
    vi.mocked(apiPost).mockResolvedValue({ id: 2, ...announcements[0] });
    vi.mocked(apiPatch).mockResolvedValue({ ...announcements[0], title: "Zaktualizowana" });
    vi.mocked(apiDelete).mockResolvedValue(undefined);
  });

  it("loads announcements from backend", async () => {
    render(<AnnouncementsAdmin />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    expect(await screen.findByText("Lista aktualności")).toBeInTheDocument();
    expect(apiGet).toHaveBeenCalledWith("/api/announcements/");

    const table = screen.getByRole("table");
    expect(within(table).getByText("Wycieczka szkolna")).toBeInTheDocument();
    expect(within(table).getByText("Zapisy są już dostępne.")).toBeInTheDocument();
    expect(within(table).getByRole("link", { name: "Otwórz" })).toHaveAttribute(
      "href",
      "https://example.com/trip.jpg",
    );
  });

  it("allows adding an announcement", async () => {
    render(<AnnouncementsAdmin />);

    await screen.findByText("Dodaj aktualność");

    fireEvent.change(screen.getByPlaceholderText("Tytuł aktualności"), {
      target: { value: "Dzień otwarty" },
    });
    fireEvent.change(screen.getByLabelText("Data aktualności"), {
      target: { value: "2026-06-02T12:30" },
    });
    fireEvent.change(screen.getByPlaceholderText("Opcjonalny link do grafiki"), {
      target: { value: "https://example.com/open-day.jpg" },
    });
    fireEvent.change(screen.getByPlaceholderText("Treść aktualności"), {
      target: { value: "Zapraszamy rodziców i uczniów." },
    });

    fireEvent.click(screen.getByRole("button", { name: "Dodaj" }));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith("/api/announcements/", {
        title: "Dzień otwarty",
        body: "Zapraszamy rodziców i uczniów.",
        image_url: "https://example.com/open-day.jpg",
        date: "2026-06-02T12:30",
      });
    });
  });

  it("allows editing and deleting an announcement", async () => {
    render(<AnnouncementsAdmin />);

    await screen.findByText("Lista aktualności");

    fireEvent.click(screen.getByRole("button", { name: /edytuj/i }));
    fireEvent.change(screen.getByPlaceholderText("Tytuł aktualności"), {
      target: { value: "Zaktualizowana" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => {
      expect(apiPatch).toHaveBeenCalledWith("/api/announcements/1/", {
        title: "Zaktualizowana",
        body: "Zapisy są już dostępne.",
        image_url: "https://example.com/trip.jpg",
        date: "2026-06-01T10:00",
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /usu/i }));

    await waitFor(() => {
      expect(apiDelete).toHaveBeenCalledWith("/api/announcements/1/");
    });
  });
});

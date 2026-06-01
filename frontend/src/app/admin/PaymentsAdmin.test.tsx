import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentsAdmin from "./PaymentsAdmin";
import { apiGet } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

describe("PaymentsAdmin", () => {
  const payments = [
    {
      id: 1,
      course: 101,
      course_name: "Matematyka",
      course_code: "MAT-1",
      amount: "199.99",
      status: "PENDING",
      date: "2026-05-01T10:00:00Z",
      user: 10,
      user_email: "parent@example.com",
    },
    {
      id: 2,
      course: 102,
      course_name: "Fizyka",
      course_code: "FIZ-2",
      amount: "249.99",
      status: "COMPLETED",
      date: "2026-05-02T10:00:00Z",
      user_name: "Anna Nowak",
    },
    {
      id: 3,
      course: 103,
      course_name: "Chemia",
      course_code: "CHE-3",
      amount: "99.50",
      status: "FAILED",
      date: "2026-05-03T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiGet).mockResolvedValue(payments);
  });

  it("loads admin payments from backend and renders summary", async () => {
    render(<PaymentsAdmin />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
    expect(await screen.findByText("Płatności")).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledWith("/api/payments/");
    expect(screen.getByText("parent@example.com")).toBeInTheDocument();
    expect(screen.getByText("Anna Nowak")).toBeInTheDocument();
    expect(screen.getByText("Matematyka")).toBeInTheDocument();
    expect(screen.getByText("Oczekująca")).toBeInTheDocument();
    expect(screen.getByText("Zakończona")).toBeInTheDocument();
    expect(screen.getByText("Nieudana")).toBeInTheDocument();
  });

  it("filters payments by status, course and search phrase", async () => {
    render(<PaymentsAdmin />);

    await screen.findByText("Matematyka");

    fireEvent.change(screen.getByLabelText("Status płatności"), {
      target: { value: "COMPLETED" },
    });

    const table = screen.getByRole("table");
    expect(within(table).getByText("Fizyka")).toBeInTheDocument();
    expect(within(table).queryByText("Matematyka")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Kurs"), { target: { value: "101" } });
    expect(within(table).getByText("Brak płatności do wyświetlenia.")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Status płatności"), {
      target: { value: "all" },
    });
    expect(within(table).getByText("Matematyka")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Szukaj po kursie lub użytkowniku"), {
      target: { value: "parent@example.com" },
    });
    expect(within(table).getByText("Matematyka")).toBeInTheDocument();
    expect(within(table).queryByText("Fizyka")).not.toBeInTheDocument();
  });

  it("shows backend errors and an empty table", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Backend niedostępny"));

    render(<PaymentsAdmin />);

    expect(await screen.findByText("Backend niedostępny")).toBeInTheDocument();
    expect(screen.getByText("Brak płatności do wyświetlenia.")).toBeInTheDocument();
  });
});

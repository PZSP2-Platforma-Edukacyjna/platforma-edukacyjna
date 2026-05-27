import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentsPage from "./page";
import { apiGet } from "@/lib/api";

vi.mock("@/components/layout/TopBar", () => ({
  default: () => <nav>TopBar</nav>,
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

describe("PaymentsPage", () => {
  const children = [
    {
      id: 10,
      first_name: "Ala",
      last_name: "Nowak",
      enrolled_courses: [1, 2],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiGet).mockResolvedValue(children);
  });

  it("loads children and builds payment rows from backend context", async () => {
    render(<PaymentsPage />);

    expect(await screen.findByText("Należności")).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledWith("/api/my-children/");
    expect(screen.getAllByText("Ala Nowak").length).toBeGreaterThan(0);
    expect(screen.getByText(/Czesne/i)).toBeInTheDocument();
    expect(screen.getByText("Materiały dydaktyczne")).toBeInTheDocument();
  });

  it("allows selecting an unpaid payment and marking it as paid", async () => {
    render(<PaymentsPage />);

    await screen.findByText("Należności");
    const checkboxes = screen.getAllByRole("checkbox");

    fireEvent.click(checkboxes[0]);

    const markPaidButton = screen.getByRole("button", { name: /Oznacz jako opłacone/i });
    expect(markPaidButton).toBeEnabled();

    fireEvent.click(markPaidButton);

    await waitFor(() => {
      expect(within(screen.getByRole("table")).getAllByText("Opłacone")).toHaveLength(2);
    });
  });

  it("shows backend errors while keeping fallback payments visible", async () => {
    vi.mocked(apiGet).mockRejectedValue(new Error("Backend niedostępny"));

    render(<PaymentsPage />);

    expect(await screen.findByText("Backend niedostępny")).toBeInTheDocument();
    expect(screen.getAllByText("Jan Kowalski").length).toBeGreaterThan(0);
  });
});

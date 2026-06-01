import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PaymentsPage from "./page";
import { apiGet } from "@/lib/api";

type ChildStub = {
  id: number;
  first_name: string;
  last_name: string;
  enrolled_courses: number[];
};

vi.mock("@/components/layout/TopBar", () => ({
  default: ({
    childList = [],
    selectedChild = null,
    onSelectChild = () => {},
  }: {
    childList?: ChildStub[];
    selectedChild?: ChildStub | null;
    onSelectChild?: (child: ChildStub) => void;
  }) => (
    <nav>
      <span>TopBar</span>
      {childList.map((child) => (
        <button
          key={child.id}
          type="button"
          aria-pressed={selectedChild?.id === child.id}
          onClick={() => onSelectChild(child)}
        >
          {child.first_name} {child.last_name}
        </button>
      ))}
    </nav>
  ),
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
}));

describe("PaymentsPage", () => {
  const payments = [
    {
      id: 1,
      course: 101,
      course_name: "Matematyka",
      course_code: "MAT-1",
      amount: "199.99",
      status: "PENDING",
      date: "2026-05-01T10:00:00Z",
    },
    {
      id: 2,
      course: 102,
      course_name: "Fizyka",
      course_code: "FIZ-2",
      amount: "249.99",
      status: "COMPLETED",
      date: "2026-05-02T10:00:00Z",
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

  const children = [
    {
      id: 10,
      first_name: "Ala",
      last_name: "Nowak",
      enrolled_courses: [101, 102],
    },
    {
      id: 11,
      first_name: "Ola",
      last_name: "Nowak",
      enrolled_courses: [103],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
    });
    vi.mocked(apiGet).mockImplementation((path) => {
      if (path === "/api/payments/") {
        return Promise.resolve(payments);
      }

      if (path === "/api/my-children/") {
        return Promise.resolve(children);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });
  });

  it("loads payments and children from backend context", async () => {
    render(<PaymentsPage />);

    expect(await screen.findByText("Historia płatności")).toBeInTheDocument();

    expect(apiGet).toHaveBeenCalledWith("/api/payments/");
    expect(apiGet).toHaveBeenCalledWith("/api/my-children/");

    const table = screen.getByRole("table");
    expect(within(table).getByText("Matematyka")).toBeInTheDocument();
    expect(within(table).getByText("MAT-1")).toBeInTheDocument();
    expect(within(table).getByText("Oczekująca")).toBeInTheDocument();
    expect(within(table).getByText("Zakończona")).toBeInTheDocument();
    expect(within(table).queryByText("Nieudana")).not.toBeInTheDocument();
  });

  it("filters payment history by course", async () => {
    render(<PaymentsPage />);

    await screen.findByText("Historia płatności");

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "102" } });

    const table = screen.getByRole("table");
    expect(within(table).getByText("Fizyka")).toBeInTheDocument();
    expect(within(table).queryByText("Matematyka")).not.toBeInTheDocument();
    expect(within(table).queryByText("Chemia")).not.toBeInTheDocument();
  });

  it("filters payment history when the selected child changes", async () => {
    render(<PaymentsPage />);

    const table = screen.getByRole("table");
    expect(await within(table).findByText("Matematyka")).toBeInTheDocument();
    expect(within(table).queryByText("Chemia")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ola Nowak" }));

    expect(await within(table).findByText("Chemia")).toBeInTheDocument();
    expect(within(table).queryByText("Matematyka")).not.toBeInTheDocument();
    expect(window.localStorage.setItem).toHaveBeenCalledWith("selectedChildId", "11");
  });

  it("shows backend errors and an empty payment table", async () => {
    vi.mocked(apiGet).mockImplementation(() => Promise.reject(new Error("Backend niedostępny")));

    render(<PaymentsPage />);

    expect(await screen.findByText("Backend niedostępny")).toBeInTheDocument();
    expect(screen.getByText("Brak płatności do wyświetlenia.")).toBeInTheDocument();
  });
});

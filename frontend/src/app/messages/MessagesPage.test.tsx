import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MessagesPage from "./page";
import { apiGet, apiPost } from "@/lib/api";
import { getUserRole } from "@/lib/auth";

vi.mock("@/components/layout/TopBar", () => ({
  default: () => <nav>TopBar</nav>,
}));

vi.mock("@/lib/api", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getUserRole: vi.fn(),
}));

describe("MessagesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
      },
    });
  });

  it("loads teacher conversations and sends a new message", async () => {
    vi.mocked(getUserRole).mockReturnValue("TEACHER");
    vi.mocked(apiGet).mockImplementation((path) => {
      if (path === "/api/users/messages/") {
        return Promise.resolve([
          {
            id: 1,
            sender: 5,
            sender_name: "Jan Kowalski",
            recipient: 2,
            recipient_name: "Nauczyciel",
            body: "Dzień dobry",
            created_at: "2026-06-01T10:00:00Z",
            read_at: null,
            is_mine: false,
          },
        ]);
      }

      if (path === "/api/users/contacts/") {
        return Promise.resolve([
          {
            id: 5,
            first_name: "Jan",
            last_name: "Kowalski",
            email: "jan@example.com",
            role: "PARENT",
          },
        ]);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });
    vi.mocked(apiPost).mockResolvedValue({
      id: 2,
      sender: 2,
      sender_name: "Nauczyciel",
      recipient: 5,
      recipient_name: "Jan Kowalski",
      body: "Odpowiedź nauczyciela",
      created_at: "2026-06-01T10:05:00Z",
      read_at: null,
      is_mine: true,
    });

    render(<MessagesPage />);

    expect((await screen.findAllByText("Jan Kowalski")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Jan Kowalski/i }));

    expect(await screen.findByText("Dzień dobry")).toBeInTheDocument();

    const textarea = screen.getByLabelText(/Nowa wiadomość/i);
    await waitFor(() => expect(textarea).not.toBeDisabled());

    fireEvent.change(textarea, { target: { value: "Odpowiedź nauczyciela" } });
    fireEvent.click(screen.getByRole("button", { name: /Wyślij/i }));

    await waitFor(() => {
      expect(apiPost).toHaveBeenCalledWith("/api/users/messages/", {
        recipient: 5,
        body: "Odpowiedź nauczyciela",
      });
    });
    expect(await screen.findByText("Odpowiedź nauczyciela")).toBeInTheDocument();
  });

  it("filters parent contacts to teachers assigned to the selected child", async () => {
    vi.mocked(getUserRole).mockReturnValue("PARENT");
    vi.mocked(apiGet).mockImplementation((path) => {
      if (path === "/api/users/messages/") {
        return Promise.resolve([]);
      }

      if (path === "/api/my-children/") {
        return Promise.resolve([
          {
            id: 10,
            first_name: "Ala",
            last_name: "Nowak",
            enrolled_courses: [100],
          },
        ]);
      }

      if (path === "/api/users/teachers/") {
        return Promise.resolve([
          {
            id: 5,
            first_name: "Anna",
            last_name: "Kowalska",
            email: "anna@example.com",
          },
          {
            id: 6,
            first_name: "Piotr",
            last_name: "Zieliński",
            email: "piotr@example.com",
          },
        ]);
      }

      if (path === "/api/my-children/schedule/") {
        return Promise.resolve([
          {
            id: 20,
            course: 100,
            course_name: "Matematyka",
            topic: "Algebra",
            date: "2030-06-01T10:00:00Z",
            teacher: 5,
          },
        ]);
      }

      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    render(<MessagesPage />);

    const contactSelect = await screen.findByLabelText("Nowa rozmowa");
    await waitFor(() => {
      expect(within(contactSelect).getByText("Anna Kowalska")).toBeInTheDocument();
    });

    expect(within(contactSelect).queryByText("Piotr Zieliński")).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentsAdmin from "./StudentsAdmin";
import { getAccessToken } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

describe("StudentsAdmin", () => {
  const students = [
    {
      id: 301,
      first_name: "Jan",
      last_name: "Kowalski",
      pesel: "12345678901",
      date_of_birth: "2014-05-10",
      parent: 11,
      enrolled_courses: [101],
    },
  ];

  const users = [
    {
      id: 11,
      email: "parent@example.com",
      first_name: "Maria",
      last_name: "Kowalska",
      role: "PARENT",
    },
    {
      id: 12,
      email: "teacher@example.com",
      first_name: "Anna",
      last_name: "Nowak",
      role: "TEACHER",
    },
  ];

  const courses = [
    {
      id: 101,
      course_code: "MAT-1",
      name: "Matematyka",
    },
    {
      id: 102,
      course_code: "FIZ-2",
      name: "Fizyka",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue("mock-token");

    global.fetch = vi.fn((url) => {
      const path = String(url);

      if (path.includes("/api/manage/students/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(students),
        });
      }

      if (path.includes("/api/users/manage/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(users),
        });
      }

      if (path.includes("/api/manage/courses/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(courses),
        });
      }

      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    }) as typeof fetch;
  });

  it("loads students with parent and course labels", async () => {
    render(<StudentsAdmin />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();

    expect(await screen.findByText("Lista uczniów")).toBeInTheDocument();
    const table = screen.getByRole("table");

    expect(within(table).getByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("12345678901")).toBeInTheDocument();
    expect(within(table).getByText("Maria Kowalska")).toBeInTheDocument();
    expect(within(table).getByText("Matematyka (MAT-1)")).toBeInTheDocument();
  });

  it("allows adding a new student with selected courses", async () => {
    render(<StudentsAdmin />);

    await screen.findByText("Dodaj ucznia");

    fireEvent.change(screen.getByPlaceholderText("Imię"), {
      target: { value: "Ola" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nazwisko"), {
      target: { value: "Zielińska" },
    });
    fireEvent.change(screen.getByPlaceholderText("PESEL"), {
      target: { value: "98765432109" },
    });
    fireEvent.change(screen.getByLabelText("Data urodzenia"), {
      target: { value: "2015-09-01" },
    });
    fireEvent.change(screen.getByLabelText("Rodzic"), {
      target: { value: "11" },
    });
    fireEvent.click(screen.getByLabelText("Fizyka (FIZ-2)"));

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 302 }),
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Dodaj" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/manage/students/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            first_name: "Ola",
            last_name: "Zielińska",
            pesel: "98765432109",
            date_of_birth: "2015-09-01",
            parent: 11,
            enrolled_courses: [102],
          }),
        }),
      );
    });
  });

  it("fills the form for editing and sends a patch request", async () => {
    render(<StudentsAdmin />);

    await screen.findByText("Lista uczniów");

    fireEvent.click(screen.getByRole("button", { name: "Edytuj" }));

    expect(screen.getByDisplayValue("Jan")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Kowalski")).toBeInTheDocument();
    expect(screen.getByLabelText("Matematyka (MAT-1)")).toBeChecked();

    fireEvent.change(screen.getByPlaceholderText("Nazwisko"), {
      target: { value: "Kowalski-Nowak" },
    });
    fireEvent.click(screen.getByLabelText("Fizyka (FIZ-2)"));

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 301 }),
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/manage/students/301/"),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("Kowalski-Nowak"),
        }),
      );
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/manage/students/301/"),
      expect.objectContaining({
        body: expect.stringContaining('"enrolled_courses":[101,102]'),
      }),
    );
  });
});

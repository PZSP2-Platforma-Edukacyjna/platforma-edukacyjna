import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CoursesAdmin from "./CoursesAdmin";
import { getAccessToken } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

describe("CoursesAdmin", () => {
  const courses = [
    {
      id: 101,
      course_code: "MAT-1",
      name: "Matematyka",
      description: "Algebra i geometria",
      teacher: 5,
    },
  ];

  const teachers = [
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
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue("mock-token");

    global.fetch = vi.fn((url) => {
      const path = String(url);

      if (path.includes("/api/manage/courses/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(courses),
        });
      }

      if (path.includes("/api/users/teachers/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(teachers),
        });
      }

      return Promise.reject(new Error(`Unexpected URL: ${path}`));
    }) as typeof fetch;
  });

  it("loads courses and teacher names", async () => {
    render(<CoursesAdmin />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();

    expect(await screen.findByText("Lista kursów")).toBeInTheDocument();
    const table = screen.getByRole("table");

    expect(screen.getByText("MAT-1")).toBeInTheDocument();
    expect(screen.getByText("Matematyka")).toBeInTheDocument();
    expect(within(table).getByText("Anna Kowalska")).toBeInTheDocument();
    expect(screen.getByText("Algebra i geometria")).toBeInTheDocument();
  });

  it("allows adding a new course", async () => {
    render(<CoursesAdmin />);

    await screen.findByText("Dodaj kurs");

    fireEvent.change(screen.getByPlaceholderText("Kod kursu"), {
      target: { value: "FIZ-2" },
    });
    fireEvent.change(screen.getByPlaceholderText("Nazwa kursu"), {
      target: { value: "Fizyka" },
    });
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "6" } });
    fireEvent.change(screen.getByPlaceholderText("Opis kursu"), {
      target: { value: "Mechanika" },
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 102 }),
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Dodaj" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/manage/courses/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            course_code: "FIZ-2",
            name: "Fizyka",
            description: "Mechanika",
            teacher: 6,
          }),
        }),
      );
    });
  });

  it("fills the form for editing and sends a patch request", async () => {
    render(<CoursesAdmin />);

    await screen.findByText("Lista kursów");

    fireEvent.click(screen.getByRole("button", { name: "Edytuj" }));

    expect(screen.getByDisplayValue("MAT-1")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Matematyka")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Nazwa kursu"), {
      target: { value: "Matematyka rozszerzona" },
    });

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 101 }),
    } as Response);

    fireEvent.click(screen.getByRole("button", { name: "Zapisz" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/manage/courses/101/"),
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining("Matematyka rozszerzona"),
        }),
      );
    });
  });
});

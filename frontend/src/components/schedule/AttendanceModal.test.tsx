import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, vi, it, expect, beforeEach, afterEach } from "vitest";
import AttendanceModal from "./AttendanceModal";
import * as auth from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

describe("AttendanceModal", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.getAccessToken).mockReturnValue("fake-token");

    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows loading state initially", () => {
    render(<AttendanceModal lessonId={1} courseId={1} onClose={mockOnClose} />);
    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();
  });

  it("shows an error instead of loading forever when token is missing", async () => {
    vi.mocked(auth.getAccessToken).mockReturnValue(null);

    render(<AttendanceModal lessonId={1} courseId={1} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.queryByText("Ładowanie...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Brak tokenu logowania.")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("fetches and displays course info and students", async () => {
    const mockCourse = {
      name: "Matematyka",
      course_code: "MAT101",
      students: [
        { id: 1, first_name: "Jan", last_name: "Kowalski" },
        { id: 2, first_name: "Anna", last_name: "Nowak" },
      ],
    };

    const mockAttendances = [{ id: 101, student: 1, lesson: 1, status: "PRESENT" }];

    vi.mocked(global.fetch).mockImplementation((url) => {
      if (url.toString().includes("/api/courses/1/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCourse),
        } as Response);
      }
      if (url.toString().includes("/api/attendances/?lesson=1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAttendances),
        } as Response);
      }
      return Promise.reject(new Error("Unknown URL"));
    });

    render(<AttendanceModal lessonId={1} courseId={1} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.queryByText("Ładowanie...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Matematyka (MAT101)")).toBeInTheDocument();
    expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();
    expect(screen.getByText("Anna Nowak")).toBeInTheDocument();
  });

  it("handles status change and makes API call", async () => {
    const mockCourse = {
      name: "Matematyka",
      course_code: "MAT101",
      students: [{ id: 1, first_name: "Jan", last_name: "Kowalski" }],
    };

    const mockAttendances: import("@/types/school").Attendance[] = [];

    vi.mocked(global.fetch).mockImplementation((url, options) => {
      if (url.toString().includes("/api/courses/1/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCourse),
        } as Response);
      }
      if (url.toString().includes("/api/attendances/?lesson=1")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAttendances),
        } as Response);
      }
      if (options?.method === "POST" && url.toString().includes("/api/attendances/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 1, student: 1, lesson: 1, status: "ABSENT" }),
        } as Response);
      }
      return Promise.reject(new Error(`Unknown URL: ${url}`));
    });

    render(<AttendanceModal lessonId={1} courseId={1} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(screen.queryByText("Ładowanie...")).not.toBeInTheDocument();
    });

    const absentButtons = screen.getAllByTitle("Nieobecny");
    expect(absentButtons.length).toBeGreaterThan(0);

    fireEvent.click(absentButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/attendances/"),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ lesson: 1, student: 1, status: "ABSENT" }),
        }),
      );
    });
  });
});

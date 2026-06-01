import { render, screen, waitFor } from "@testing-library/react";
import { describe, vi, it, expect, beforeEach, afterEach } from "vitest";
import Dashboard from "./page";
import * as auth from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
  getUserRole: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/dashboard",
}));

describe("Dashboard Page - Parent Attendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.getAccessToken).mockReturnValue("fake-token");
    vi.mocked(auth.getUserRole).mockReturnValue("PARENT");
    global.fetch = vi.fn();

    Object.defineProperty(window, "localStorage", {
      value: {
        setItem: vi.fn(),
        getItem: vi.fn(),
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and displays attendance data for a parent's child", async () => {
    const mockChildren = [
      { id: 1, first_name: "Jan", last_name: "Kowalski", enrolled_courses: [10] },
    ];
    const mockLessons = [
      { id: 100, course: 10, course_name: "Matematyka", date: "2026-06-01T10:00:00Z", teacher: 2 },
    ];
    const mockTeachers = [{ id: 2, first_name: "Anna", last_name: "Nowak" }];
    const mockCourses = [
      { id: 10, course_code: "MAT", name: "Matematyka", description: "", teacher: 2 },
    ];
    const mockAttendances = [
      { id: 50, lesson: 100, student: 1, status: "PRESENT", date_marked: "2026-06-01T10:30:00Z" },
    ];

    vi.mocked(global.fetch).mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/my-children/schedule/"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockLessons) } as Response);
      if (urlStr.includes("/api/my-children/"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockChildren) } as Response);
      if (urlStr.includes("/api/users/teachers/"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTeachers) } as Response);
      if (urlStr.includes("/api/courses/"))
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockCourses) } as Response);
      if (urlStr.includes("/api/attendances/"))
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAttendances),
        } as Response);
      return Promise.reject(new Error(`Unknown URL: ${urlStr}`));
    });

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.queryByText("Ładowanie...")).not.toBeInTheDocument();
    });

    expect(screen.getAllByText("Matematyka").length).toBeGreaterThan(0);

    await waitFor(() => {
      const presentIndicator = document.querySelector(".bg-green-500");
      expect(presentIndicator).toBeInTheDocument();
    });
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import LessonsAdmin from "./LessonsAdmin";
import { getAccessToken } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

describe("LessonsAdmin", () => {
  const mockLessons = [
    { id: 1, course: 101, course_name: "Math", topic: "Algebra", date: "2026-06-01T10:00:00Z" },
  ];
  const mockCourses = [{ id: 101, name: "Math", course_code: "M101" }];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue("mock-token");

    // mock fetch
    global.fetch = vi.fn((url) => {
      if (url.includes("/api/manage/lessons/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockLessons),
        });
      }
      if (url.includes("/api/manage/courses/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCourses),
        });
      }
      return Promise.reject(new Error("Unknown URL"));
    }) as any;
  });

  it("renders lessons and courses", async () => {
    render(<LessonsAdmin />);

    expect(screen.getByText("Ładowanie...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Harmonogram (Lekcje)")).toBeInTheDocument();
    });

    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("Math (M101)")).toBeInTheDocument();
  });

  it("allows adding a new lesson", async () => {
    render(<LessonsAdmin />);

    await waitFor(() => expect(screen.getByText("Dodaj Lekcję")).toBeInTheDocument());

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "101" } });
    fireEvent.change(screen.getByPlaceholderText("Temat"), { target: { value: "Geometry" } });

    // actually input type="datetime-local" doesn't have a simple label in the code, it just has name="date"
    const dateInput = document.querySelector('input[name="date"]') as HTMLInputElement;
    fireEvent.change(dateInput, { target: { value: "2026-06-02T11:00" } });

    const submitBtn = screen.getByRole("button", { name: "Dodaj" });

    // mock successful post
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({}) } as any);

    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/manage/lessons/"),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });
  });
});

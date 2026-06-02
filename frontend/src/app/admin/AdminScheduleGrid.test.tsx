import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminScheduleGrid from "./AdminScheduleGrid";
import { getAccessToken } from "@/lib/auth";

vi.mock("@/lib/auth", () => ({
  getAccessToken: vi.fn(),
}));

describe("AdminScheduleGrid", () => {
  const courses = [
    { id: 1, name: "Matematyka", course_code: "MAT-1" },
    { id: 2, name: "Fizyka", course_code: "FIZ-2" },
  ];

  const overlappingLessons = [
    {
      id: 101,
      course: 1,
      course_name: "Matematyka",
      topic: "Algebra",
      date: "2026-06-01T08:00:00",
    },
    {
      id: 102,
      course: 2,
      course_name: "Fizyka",
      topic: "Termodynamika",
      date: "2026-06-01T08:00:00",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAccessToken).mockReturnValue("access-token");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    global.fetch = vi.fn().mockResolvedValue({ ok: true });
  });

  it("shows all lessons assigned to the same day and hour", () => {
    render(
      <AdminScheduleGrid courses={courses} lessons={overlappingLessons} onRefresh={vi.fn()} />,
    );

    expect(screen.getByText("Matematyka (MAT-1)")).toBeInTheDocument();
    expect(screen.getByText("Algebra")).toBeInTheDocument();
    expect(screen.getByText("Fizyka (FIZ-2)")).toBeInTheDocument();
    expect(screen.getByText("Termodynamika")).toBeInTheDocument();
  });

  it("deletes the selected lesson from an overlapping slot", async () => {
    const onRefresh = vi.fn();
    render(
      <AdminScheduleGrid courses={courses} lessons={overlappingLessons} onRefresh={onRefresh} />,
    );

    fireEvent.click(screen.getByText("Termodynamika").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: "Usuń" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/manage/lessons/102/"),
        expect.objectContaining({ method: "DELETE" }),
      );
    });
    expect(onRefresh).toHaveBeenCalled();
  });
});

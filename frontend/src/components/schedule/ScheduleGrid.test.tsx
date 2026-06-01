import { render, screen, fireEvent } from "@testing-library/react";
import { describe, vi, it, expect } from "vitest";
import ScheduleGrid, { Schedule } from "./ScheduleGrid";

describe("ScheduleGrid", () => {
  const mockSchedule: Schedule = {
    Pon: {
      8: { id: 1, subject: "Matematyka", teacher: "Jan Kowalski", status: "PRESENT" },
      9: { id: 2, subject: "Fizyka", teacher: "Anna Nowak", status: "ABSENT" },
    },
    Wt: {
      10: { id: 3, subject: "Chemia", teacher: "Piotr Wiśniewski", status: "EXCUSED" },
    },
  };

  it("renders all days of the week", () => {
    render(<ScheduleGrid schedule={{}} />);
    expect(screen.getByText("Pon")).toBeInTheDocument();
    expect(screen.getByText("Wt")).toBeInTheDocument();
    expect(screen.getByText("Śr")).toBeInTheDocument();
    expect(screen.getByText("Czw")).toBeInTheDocument();
    expect(screen.getByText("Pt")).toBeInTheDocument();
  });

  it("renders lessons in the correct slots", () => {
    render(<ScheduleGrid schedule={mockSchedule} />);

    expect(screen.getByText("Matematyka")).toBeInTheDocument();
    expect(screen.getByText("Jan Kowalski")).toBeInTheDocument();

    expect(screen.getByText("Fizyka")).toBeInTheDocument();
    expect(screen.getByText("Anna Nowak")).toBeInTheDocument();

    expect(screen.getByText("Chemia")).toBeInTheDocument();
    expect(screen.getByText("Piotr Wiśniewski")).toBeInTheDocument();
  });

  it("renders hours from 8 to 18", () => {
    render(<ScheduleGrid schedule={{}} />);
    for (let h = 8; h <= 18; h++) {
      expect(screen.getByText(`${h}:00`)).toBeInTheDocument();
    }
  });

  it("calls onSlotClick when a tile is clicked", () => {
    const onSlotClick = vi.fn();
    render(<ScheduleGrid schedule={mockSchedule} onSlotClick={onSlotClick} />);

    fireEvent.click(screen.getByText("Matematyka").closest("div")!);
    expect(onSlotClick).toHaveBeenCalledWith(0, 8, mockSchedule["Pon"][8]);
  });

  it("calls onLessonClick when a tile is clicked and no onSlotClick is provided", () => {
    const onLessonClick = vi.fn();
    render(<ScheduleGrid schedule={mockSchedule} onLessonClick={onLessonClick} />);

    fireEvent.click(screen.getByText("Matematyka").closest("div")!);
    expect(onLessonClick).toHaveBeenCalledWith(mockSchedule["Pon"][8], "Pon", 8);
  });
});

import React from "react";
import ScheduleTile from "./ScheduleTile";

export type Lesson = {
  id?: number;
  subject: string;
  teacher: string;
  status?: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" | "default";
};

export type Schedule = Record<string, Record<number, Lesson>>;

const days = ["Pon", "Wt", "Śr", "Czw", "Pt"];

type Props = {
  schedule: Schedule;
  onSlotClick?: (dayIndex: number, hour: number, lesson?: Lesson) => void;
  onLessonClick?: (lesson: Lesson, day: string, hour: number) => void;
};

export default function ScheduleGrid({ schedule, onSlotClick, onLessonClick }: Props) {
  const hours = Array.from({ length: 11 }, (_, i) => 8 + i); // 8:00 to 18:00

  return (
    <div className="grid w-full grid-cols-[3rem_repeat(5,minmax(0,1fr))] gap-1 text-xs">
      <div></div>

      {days.map((day) => (
        <div key={day} className="text-center font-semibold pb-2">
          {day}
        </div>
      ))}

      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className="self-start pr-2 pt-1 text-right text-gray-500 font-medium">{hour}:00</div>

          {days.map((day, dayIndex) => {
            const lesson = schedule[day]?.[hour];

            return (
              <ScheduleTile
                key={day + hour}
                subject={lesson?.subject}
                teacher={lesson?.teacher}
                status={lesson?.status}
                onClick={
                  onSlotClick
                    ? () => onSlotClick(dayIndex, hour, lesson)
                    : lesson && onLessonClick
                      ? () => onLessonClick(lesson, day, hour)
                      : undefined
                }
              />
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

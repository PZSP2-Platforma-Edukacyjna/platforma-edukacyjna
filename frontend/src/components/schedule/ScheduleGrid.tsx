import React from "react";
import ScheduleTile from "./ScheduleTile";

export type Lesson = {
  subject: string;
  teacher: string;
  status: "present" | "absent" | "excused";
};

export type Schedule = Record<string, Record<number, Lesson>>;

const days = ["Pon", "Wt", "Śr", "Czw", "Pt"];

type Props = {
  schedule: Schedule;
};

export default function ScheduleGrid({ schedule }: Props) {
  const hours = Array.from({ length: 10 }, (_, i) => 8 + i);

  return (
    <div className="grid w-full grid-cols-[3rem_repeat(5,minmax(0,1fr))] gap-1 text-xs">
      <div></div>

      {days.map((day) => (
        <div key={day} className="text-center font-semibold">
          {day}
        </div>
      ))}

      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className="self-start pr-2 pt-1 text-right">{hour}:00</div>

          {days.map((day) => {
            const lesson = schedule[day]?.[hour];

            return (
              <ScheduleTile
                key={day + hour}
                subject={lesson?.subject}
                teacher={lesson?.teacher}
                status={lesson?.status}
              />
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

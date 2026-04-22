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
  console.log("ScheduleGrid schedule:", schedule);

  return (
    <div className="grid grid-cols-6 gap-1 text-xs">
      <div></div>

      {days.map((d) => (
        <div key={d} className="text-center font-semibold">
          {d}
        </div>
      ))}

      {hours.map((hour) => (
        <React.Fragment key={hour}>
          <div className="text-right pr-2">{hour}:00</div>

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

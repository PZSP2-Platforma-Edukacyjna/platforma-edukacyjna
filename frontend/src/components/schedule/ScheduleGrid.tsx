import ScheduleTile from "./ScheduleTile";

const teachers = {
  nowak: "Anna Nowak",
  kowalski: "Krzysztof Kowalski",
  pszeniczny: "Piotr Pszeniczny",
  wisniewski: "Marek Wiśniewski",
  mazur: "Joanna Mazur",
  lewandowski: "Paweł Lewandowski",
  zielinski: "Tomasz Zieliński",
  kaczmarek: "Piotr Kaczmarek",
  nowicki: "Adam Nowicki",
  dabrowski: "Michał Dąbrowski",
  piotrowski: "Rafał Piotrowski",
};

// 1) typ kluczy nauczycieli
type TeacherKey = keyof typeof teachers;

// 2) typ lekcji
type Lesson = {
  subject: string;
  teacher: TeacherKey;
  status: "present" | "absent" | "excused";
};

const days = ["Pon", "Wt", "Śr", "Czw", "Pt"];

const schedule: Record<string, Record<number, Lesson>> = {
  Pon: {
    8: { subject: "Matematyka", teacher: "nowak", status: "present" },
    9: { subject: "Fizyka", teacher: "kowalski", status: "absent" },
    10: { subject: "Język angielski", teacher: "pszeniczny", status: "present" },
    11: { subject: "Historia", teacher: "wisniewski", status: "excused" },
    12: { subject: "Biologia", teacher: "mazur", status: "present" },
  },
  Wt: {
    10: { subject: "Chemia", teacher: "lewandowski", status: "present" },
    11: { subject: "Matematyka", teacher: "nowak", status: "present" },
    12: { subject: "Geografia", teacher: "zielinski", status: "present" },
    13: { subject: "Informatyka", teacher: "kaczmarek", status: "present" },
    14: { subject: "Wychowanie fizyczne", teacher: "nowicki", status: "present" },
    15: { subject: "Muzyka", teacher: "dabrowski", status: "excused" },
    16: { subject: "Plastyka", teacher: "piotrowski", status: "present" },
  },
  Śr: {
    10: { subject: "Matematyka", teacher: "nowak", status: "present" },
    11: { subject: "Fizyka", teacher: "kowalski", status: "present" },
    12: { subject: "Chemia", teacher: "lewandowski", status: "present" },
  },
  Czw: {
    9: { subject: "Historia", teacher: "wisniewski", status: "present" },
    10: { subject: "Geografia", teacher: "zielinski", status: "present" },
    11: { subject: "Biologia", teacher: "mazur", status: "present" },
    12: { subject: "Język angielski", teacher: "pszeniczny", status: "present" },
    13: { subject: "Informatyka", teacher: "kaczmarek", status: "present" },
  },
  Pt: {
    12: { subject: "Matematyka", teacher: "nowak", status: "present" },
    13: { subject: "Fizyka", teacher: "kowalski", status: "present" },
    14: { subject: "Chemia", teacher: "lewandowski", status: "present" },
    15: { subject: "Wychowanie fizyczne", teacher: "nowicki", status: "present" },
  },
};

export default function ScheduleGrid() {
  const hours = Array.from({ length: 10 }, (_, i) => 8 + i);

  return (
    <div className="grid grid-cols-6 gap-1 text-xs -ml-70">
      <div></div>

      {days.map((d) => (
        <div key={d} className="text-center font-semibold">
          {d}
        </div>
      ))}

      {hours.map((hour) => (
        <>
          <div key={hour} className="text-right pr-2">
            {hour}:00
          </div>

          {days.map((day) => {
            const lesson = schedule[day]?.[hour];
            return (
              <ScheduleTile
                key={day + hour}
                subject={lesson?.subject}
                teacher={lesson ? teachers[lesson.teacher] : undefined}
                status={lesson?.status}
              />
            );
          })}
        </>
      ))}
    </div>
  );
}
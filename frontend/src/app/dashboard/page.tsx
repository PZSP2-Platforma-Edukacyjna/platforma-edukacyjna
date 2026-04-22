"use client";
import TopBar from "@/components/layout/TopBar";
import ScheduleGrid, { Schedule } from "@/components/schedule/ScheduleGrid";
import SubjectsList from "@/components/subjects/SubjectsList";
import MessagesList from "@/components/messages/MessagesList";
import NewsList from "@/components/news/NewsList";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useState } from "react";

export type Child = {
  id: number;
  first_name: string;
  last_name: string;
  enrolled_courses: number[];
};

type Teacher = {
  id: number;
  first_name: string;
  last_name: string;
};

type Lesson = {
  id: number;
  course: number;
  course_name: string;
  topic: string;
  date: string;
  teacher: number;
};

const dayMapping: Record<number, string> = {
  0: "Niedz",
  1: "Pon",
  2: "Wt",
  3: "Śr",
  4: "Czw",
  5: "Pt",
  6: "Sob",
};

function processSchedule(lessons: Lesson[], courses: number[], teachers: Teacher[]): Schedule {
  const schedule: Schedule = {};

  const filteredLessons = lessons.filter((lesson) => courses.includes(lesson.course));

  filteredLessons.forEach((lesson) => {
    const date = new Date(lesson.date);
    const day = dayMapping[date.getDay()];
    const hour = date.getHours();

    if (!schedule[day]) {
      schedule[day] = {};
    }

    const teacher = teachers.find((t) => t.id === lesson.teacher);

    schedule[day][hour] = {
      subject: lesson.course_name,
      teacher: teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown",
      status: "present",
    };
  });

  return schedule;
}

export default function Dashboard() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getData() {
      const token = getAccessToken();
      try {
        const [childrenRes, lessonsRes, teachersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/my-children/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/my-children/schedule/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/teachers/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!childrenRes.ok || !lessonsRes.ok || !teachersRes.ok) {
          throw new Error("Failed to fetch data");
        }
        const childrenData = await childrenRes.json();
        const lessonsData = await lessonsRes.json();
        const teachersData = await teachersRes.json();
        setChildren(childrenData);
        setLessons(lessonsData);
        setTeachers(teachersData);

        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0]);
          setSchedule(processSchedule(lessonsData, childrenData[0].enrolled_courses, teachersData));
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    getData();
  }, []);

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    const newSchedule = processSchedule(lessons, child.enrolled_courses, teachers);
    setSchedule(newSchedule);
  };

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        childList={children}
        selectedChild={selectedChild}
        onSelectChild={handleSelectChild}
      />

      <div className="flex flex-1 gap-4 p-4">
        {/* LEWA */}
        <div className="flex flex-col flex-[4] gap-4">
          {/* PLAN */}
          <div className="card flex-[2] overflow-auto">
            {loading && <div>Loading...</div>}
            {error && <div>Error: {error}</div>}
            {!loading && !error && <ScheduleGrid schedule={schedule} />}
          </div>

          {/* DÓŁ */}
          <div className="flex flex-[1] gap-4">
            <div className="flex-1">
              <NewsList />
            </div>

            <div className="flex-1">
              <MessagesList />
            </div>
          </div>
        </div>

        {/* PRAWA */}
        <div className="flex-[1] max-w-[20%]">
          <SubjectsList />
        </div>
      </div>
    </div>
  );
}

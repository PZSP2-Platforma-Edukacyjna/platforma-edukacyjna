"use client";

import TopBar from "@/components/layout/TopBar";
import MessagesList from "@/components/messages/MessagesList";
import NewsList from "@/components/news/NewsList";
import ScheduleGrid, { Schedule } from "@/components/schedule/ScheduleGrid";
import CourseDetails from "@/components/subjects/CourseDetails";
import SubjectsList from "@/components/subjects/SubjectsList";
import { getAccessToken, getUserRole } from "@/lib/auth";
import type { Child, Lesson, Teacher } from "@/types/school";
import { useEffect, useState } from "react";

type LearningMaterial = {
  id: number;
  title: string;
  description: string;
  url: string;
};

type CourseListItem = {
  id: number;
  course_code: string;
  name: string;
  description: string;
  teacher: number;
};

type CourseDetailsData = CourseListItem & {
  learning_materials: LearningMaterial[];
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

    const teacher = teachers.find((item) => item.id === lesson.teacher);

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
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedChildCourses, setSelectedChildCourses] = useState<CourseListItem[]>([]);
  const [detailedCourse, setDetailedCourse] = useState<CourseDetailsData | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function getData() {
      const role = getUserRole();

      if (role === "ADMIN") {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      const token = getAccessToken();

      try {
        const [childrenRes, lessonsRes, teachersRes, coursesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/my-children/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/my-children/schedule/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/teachers/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/courses/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!childrenRes.ok || !lessonsRes.ok || !teachersRes.ok || !coursesRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const childrenData = (await childrenRes.json()) as Child[];
        const lessonsData = (await lessonsRes.json()) as Lesson[];
        const teachersData = (await teachersRes.json()) as Teacher[];
        const coursesData = (await coursesRes.json()) as CourseListItem[];

        setChildren(childrenData);
        setLessons(lessonsData);
        setTeachers(teachersData);
        setCourses(coursesData);

        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0]);
          setSchedule(processSchedule(lessonsData, childrenData[0].enrolled_courses, teachersData));
        }
      } catch (requestError: unknown) {
        if (requestError instanceof Error) {
          setError(requestError.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    }

    getData();
  }, []);

  useEffect(() => {
    if (selectedChild && courses.length > 0) {
      const childCourses = courses.filter((course) =>
        selectedChild.enrolled_courses.includes(course.id),
      );
      setSelectedChildCourses(childCourses);
    }
  }, [selectedChild, courses]);

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    const newSchedule = processSchedule(lessons, child.enrolled_courses, teachers);
    setSchedule(newSchedule);
  };

  const handleCourseClick = async (course: CourseListItem) => {
    const token = getAccessToken();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/courses/${course.id}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to fetch course details");
      }

      const courseDetails = (await res.json()) as CourseDetailsData;

      setDetailedCourse({
        ...courseDetails,
        learning_materials: courseDetails.learning_materials ?? [],
      });
    } catch (requestError: unknown) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  const handleCloseDetails = () => {
    setDetailedCourse(null);
  };

  return (
    <div className="h-screen flex flex-col">
      <TopBar
        childList={children}
        selectedChild={selectedChild}
        onSelectChild={handleSelectChild}
        isAdmin={isAdmin}
      />

      <div className="flex flex-1 gap-4 p-4">
        <div className="flex flex-col flex-[4] gap-4">
          {!isAdmin && (
            <div className="card flex-[2] overflow-auto">
              {loading && <div>Ładowanie...</div>}
              {error && <div>Błąd: {error}</div>}
              {!loading && !error && <ScheduleGrid schedule={schedule} />}
            </div>
          )}

          <div className="flex flex-[1] gap-4">
            <div className="flex-1">
              <NewsList />
            </div>

            <div className="flex-1">
              <MessagesList />
            </div>
          </div>
        </div>

        {!isAdmin && (
          <div className="flex-[1] max-w-[20%]">
            <SubjectsList
              courses={selectedChildCourses}
              teachers={teachers}
              onCourseClick={handleCourseClick}
            />
          </div>
        )}
        {!isAdmin && detailedCourse && (
          <CourseDetails course={detailedCourse} teachers={teachers} onClose={handleCloseDetails} />
        )}
      </div>
    </div>
  );
}

"use client";

import AdminPanel from "@/app/admin/AdminPanel";
import TopBar from "@/components/layout/TopBar";
import MessagesList from "@/components/messages/MessagesList";
import NewsList from "@/components/news/NewsList";
import ScheduleGrid, { Schedule } from "@/components/schedule/ScheduleGrid";
import CourseDetails from "@/components/subjects/CourseDetails";
import SubjectsList from "@/components/subjects/SubjectsList";
import TeacherMaterialsPanel from "@/components/subjects/TeacherMaterialsPanel";
import AttendanceModal from "@/components/schedule/AttendanceModal";
import { getAccessToken, getUserRole } from "@/lib/auth";
import type { Attendance, Child, Lesson, Teacher } from "@/types/school";
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

function processSchedule(
  lessons: Lesson[],
  courses: number[],
  teachers: Teacher[],
  attendances: Attendance[] = [],
  studentId?: number,
): Schedule {
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

    let status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" | undefined = undefined;
    if (studentId) {
      const attendance = attendances.find((a) => a.lesson === lesson.id && a.student === studentId);
      if (attendance) {
        status = attendance.status;
      }
    }

    schedule[day][hour] = {
      id: lesson.id,
      subject: lesson.course_name,
      teacher: teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown",
      status: status,
    };
  });

  return schedule;
}

function storeSelectedChildId(childId: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("selectedChildId", String(childId));
}

function getStoredSelectedChildId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem("selectedChildId");

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
}

function getInitialSelectedChild(children: Child[]): Child | null {
  const storedChildId = getStoredSelectedChildId();

  return children.find((child) => child.id === storedChildId) ?? children[0] ?? null;
}

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [selectedChildCourses, setSelectedChildCourses] = useState<CourseListItem[]>([]);

  const [detailedCourse, setDetailedCourse] = useState<CourseDetailsData | null>(null);
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<{
    lessonId: number;
    courseId: number;
  } | null>(null);
  const [schedule, setSchedule] = useState<Schedule>({});
  const [attendances, setAttendances] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function getData() {
      const currentRole = getUserRole();
      const token = getAccessToken();

      setRole(currentRole);
      setError(null);

      if (currentRole === "ADMIN") {
        setIsAdmin(true);
        setLoading(false);
        return;
      }

      if (!token) {
        setError("Brak tokenu logowania.");
        setLoading(false);
        return;
      }

      if (currentRole === "TEACHER") {
        try {
          const [lessonsRes, teachersRes, coursesRes] = await Promise.all([
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/teacher/schedule/`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/teachers/`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/courses/`, {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);

          if (!lessonsRes.ok || !teachersRes.ok || !coursesRes.ok) {
            throw new Error("Failed to fetch teacher data");
          }

          const lessonsData = (await lessonsRes.json()) as Lesson[];
          const teachersData = (await teachersRes.json()) as Teacher[];
          const coursesData = (await coursesRes.json()) as CourseListItem[];

          const teacherCourseIds = Array.from(new Set(lessonsData.map((lesson) => lesson.course)));

          setChildren([]);
          setSelectedChild(null);
          setLessons(lessonsData);
          setTeachers(teachersData);
          setCourses(coursesData);
          setSelectedChildCourses([]);
          setAttendances([]);
          setSchedule(processSchedule(lessonsData, teacherCourseIds, teachersData));
        } catch (requestError: unknown) {
          if (requestError instanceof Error) {
            setError(requestError.message);
          } else {
            setError("An unknown error occurred");
          }
        } finally {
          setLoading(false);
        }

        return;
      }

      if (currentRole === "PARENT") {
        try {
          const [childrenRes, lessonsRes, teachersRes, coursesRes, attendancesRes] =
            await Promise.all([
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
              fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/attendances/`, {
                headers: { Authorization: `Bearer ${token}` },
              }).catch(() => null),
            ]);

          if (!childrenRes.ok || !lessonsRes.ok || !teachersRes.ok || !coursesRes.ok) {
            throw new Error("Failed to fetch parent data");
          }

          const childrenData = (await childrenRes.json()) as Child[];
          const lessonsData = (await lessonsRes.json()) as Lesson[];
          const teachersData = (await teachersRes.json()) as Teacher[];
          const coursesData = (await coursesRes.json()) as CourseListItem[];
          const attendancesData = attendancesRes?.ok
            ? ((await attendancesRes.json()) as Attendance[])
            : [];

          setChildren(childrenData);
          setLessons(lessonsData);
          setTeachers(teachersData);
          setCourses(coursesData);
          setAttendances(attendancesData);

          if (childrenData.length > 0) {
            const initialSelectedChild = getInitialSelectedChild(childrenData);

            setSelectedChild(initialSelectedChild);
            if (initialSelectedChild) {
              storeSelectedChildId(initialSelectedChild.id);
              setSchedule(
                processSchedule(
                  lessonsData,
                  initialSelectedChild.enrolled_courses,
                  teachersData,
                  attendancesData,
                  initialSelectedChild.id,
                ),
              );
            }
          } else {
            setSelectedChild(null);
            setSchedule({});
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

        return;
      }

      setError("Nieznana rola użytkownika.");
      setLoading(false);
    }

    getData();
  }, []);

  useEffect(() => {
    if (selectedChild && courses.length > 0) {
      const childCourses = courses.filter((course) =>
        selectedChild.enrolled_courses.includes(course.id),
      );

      setSelectedChildCourses(childCourses);
    } else {
      setSelectedChildCourses([]);
    }
  }, [selectedChild, courses]);

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    storeSelectedChildId(child.id);

    const newSchedule = processSchedule(
      lessons,
      child.enrolled_courses,
      teachers,
      attendances,
      child.id,
    );
    setSchedule(newSchedule);
  };

  const handleCourseClick = async (course: CourseListItem) => {
    const token = getAccessToken();

    if (!token) {
      setError("Brak tokenu logowania.");
      return;
    }

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

  const handleLessonClick = (lessonData: import("@/components/schedule/ScheduleGrid").Lesson) => {
    if (role === "TEACHER" && lessonData.id) {
      const fullLesson = lessons.find((l) => l.id === lessonData.id);
      if (fullLesson) {
        setSelectedLessonForAttendance({
          lessonId: fullLesson.id,
          courseId: fullLesson.course,
        });
      }
    }
  };

  const handleCloseAttendanceModal = () => {
    setSelectedLessonForAttendance(null);
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
          {(role === "PARENT" || role === "TEACHER") && (
            <div className="card flex-[2] overflow-auto">
              {loading && <div>Ładowanie...</div>}
              {error && <div>Błąd: {error}</div>}

              {!loading && !error && (
                <>
                  {role === "TEACHER" && (
                    <div className="mb-3">
                      <h2 className="text-xl font-semibold">Plan lekcji nauczyciela</h2>
                    </div>
                  )}

                  {role === "PARENT" && (
                    <div className="mb-3">
                      <h2 className="text-xl font-semibold">Plan lekcji dziecka</h2>
                    </div>
                  )}

                  <ScheduleGrid
                    schedule={schedule}
                    onLessonClick={role === "TEACHER" ? handleLessonClick : undefined}
                  />
                </>
              )}
            </div>
          )}

          {role === "ADMIN" && (
            <div className="flex-[2] overflow-auto rounded border bg-white p-4">
              <AdminPanel />
            </div>
          )}

          {!loading && !role && (
            <div className="card flex-[2] overflow-auto">
              <h2 className="text-xl font-semibold">Brak roli użytkownika</h2>
              <p className="mt-2 text-gray-600">Nie udało się ustalić roli użytkownika.</p>
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

        {role === "PARENT" && (
          <div className="flex-[1] max-w-[20%]">
            <SubjectsList
              courses={selectedChildCourses}
              teachers={teachers}
              onCourseClick={handleCourseClick}
            />
          </div>
        )}

        {role === "TEACHER" && !loading && !error && (
          <div className="flex-[1.2] max-w-[28%]">
            <TeacherMaterialsPanel courses={courses} />
          </div>
        )}

        {role === "PARENT" && detailedCourse && (
          <CourseDetails course={detailedCourse} teachers={teachers} onClose={handleCloseDetails} />
        )}

        {selectedLessonForAttendance && (
          <AttendanceModal
            lessonId={selectedLessonForAttendance.lessonId}
            courseId={selectedLessonForAttendance.courseId}
            onClose={handleCloseAttendanceModal}
          />
        )}
      </div>
    </div>
  );
}

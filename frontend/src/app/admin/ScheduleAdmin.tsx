"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import AdminScheduleGrid from "./AdminScheduleGrid";

export type Lesson = {
  id: number;
  course: number;
  course_name: string;
  topic: string;
  date: string;
};

export type Course = {
  id: number;
  name: string;
  course_code: string;
};

export default function ScheduleAdmin() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering state
  const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fetchData = async () => {
    const token = getAccessToken();
    try {
      const [lessonsRes, coursesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!lessonsRes.ok || !coursesRes.ok) throw new Error("Failed to fetch data");

      const lessonsData = await lessonsRes.json();
      const coursesData = await coursesRes.json();

      setLessons(lessonsData);
      setCourses(coursesData);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLessons =
    selectedCourseIds.length === 0
      ? lessons
      : lessons.filter((l) => selectedCourseIds.includes(l.course));

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error}</div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 bg-white p-4 rounded shadow">
        <h2 className="text-xl font-bold">Edytor Planu Lekcji</h2>
        <div className="flex items-center gap-4">
          <label className="font-semibold text-sm">Filtruj po kursie:</label>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="border p-2 rounded flex items-center justify-between w-64 bg-white"
            >
              <span className="truncate">
                {selectedCourseIds.length === 0
                  ? "Wszystkie kursy"
                  : `Wybrano (${selectedCourseIds.length})`}
              </span>
              <span className="text-xs ml-2">▼</span>
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 w-64 bg-white border rounded shadow-lg z-10 max-h-60 overflow-y-auto">
                <div
                  className="p-2 border-b hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                  onClick={() => setSelectedCourseIds([])}
                >
                  <input
                    type="checkbox"
                    checked={selectedCourseIds.length === 0}
                    readOnly
                    className="cursor-pointer"
                  />
                  <span className="text-sm font-medium">Wszystkie kursy</span>
                </div>
                {courses.map((c) => {
                  const isSelected = selectedCourseIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      className="p-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedCourseIds(selectedCourseIds.filter((id) => id !== c.id));
                        } else {
                          setSelectedCourseIds([...selectedCourseIds, c.id]);
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="cursor-pointer"
                      />
                      <span className="text-sm">
                        {c.name} ({c.course_code})
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <AdminScheduleGrid lessons={filteredLessons} courses={courses} onRefresh={fetchData} />
      </div>
    </div>
  );
}

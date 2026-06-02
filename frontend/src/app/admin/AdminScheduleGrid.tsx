import React, { useState } from "react";
import { getAccessToken } from "@/lib/auth";
import { Course, Lesson as AdminLesson } from "./ScheduleAdmin";

const daysMapping = ["Pon", "Wt", "Śr", "Czw", "Pt"];
const fullDayNames = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];
const hours = Array.from({ length: 11 }, (_, i) => 8 + i);

type Props = {
  lessons: AdminLesson[];
  courses: Course[];
  onRefresh: () => void;
};

type SlotLesson = AdminLesson & {
  subjectTitle: string;
};

export default function AdminScheduleGrid({ lessons, courses, onRefresh }: Props) {
  const [editingSlot, setEditingSlot] = useState<{
    day: number;
    hour: number;
    lessonId?: number;
  } | null>(null);
  const [formData, setFormData] = useState({
    course: "",
    topic: "",
  });

  const lessonsBySlot: Record<string, Record<number, SlotLesson[]>> = {};

  lessons.forEach((lesson) => {
    const date = new Date(lesson.date);
    const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1;
    if (dayIndex < 0 || dayIndex > 4) {
      return;
    }

    const hour = date.getHours();
    const dayName = daysMapping[dayIndex];
    const course = courses.find((item) => item.id === lesson.course);
    const subjectTitle = course
      ? `${lesson.course_name} (${course.course_code})`
      : lesson.course_name;

    if (!lessonsBySlot[dayName]) {
      lessonsBySlot[dayName] = {};
    }

    if (!lessonsBySlot[dayName][hour]) {
      lessonsBySlot[dayName][hour] = [];
    }

    lessonsBySlot[dayName][hour].push({
      ...lesson,
      subjectTitle,
    });
  });

  const handleCellClick = (dayIndex: number, hour: number, lessonId?: number) => {
    if (lessonId) {
      const originalLesson = lessons.find((lesson) => lesson.id === lessonId);
      setEditingSlot({ day: dayIndex, hour, lessonId });

      if (originalLesson) {
        setFormData({
          course: originalLesson.course.toString(),
          topic: originalLesson.topic,
        });
      }

      return;
    }

    setEditingSlot({ day: dayIndex, hour });
    setFormData({ course: "", topic: "" });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingSlot) {
      return;
    }

    const token = getAccessToken();
    const isEdit = !!editingSlot.lessonId;

    const now = new Date();
    const targetDayIndex = editingSlot.day + 1;
    const currentDayIndex = now.getDay() === 0 ? 7 : now.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) {
      daysToAdd += 7;
    }

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    targetDate.setHours(editingSlot.hour, 0, 0, 0);

    let finalDate = targetDate.toISOString();
    if (isEdit) {
      const originalLesson = lessons.find((lesson) => lesson.id === editingSlot.lessonId);
      if (originalLesson) {
        const originalDate = new Date(originalLesson.date);
        originalDate.setHours(editingSlot.hour, 0, 0, 0);
        const originalDayIndex = originalDate.getDay() === 0 ? 6 : originalDate.getDay() - 1;
        if (originalDayIndex !== editingSlot.day) {
          originalDate.setDate(originalDate.getDate() + editingSlot.day - originalDayIndex);
        }
        finalDate = originalDate.toISOString();
      }
    }

    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/${editingSlot.lessonId}/`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/`;

    const method = isEdit ? "PATCH" : "POST";
    const body = {
      course: parseInt(formData.course),
      topic: formData.topic,
      date: finalDate,
    };

    try {
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        alert("Błąd przy zapisywaniu lekcji.");
        return;
      }

      setEditingSlot(null);
      onRefresh();
    } catch {
      alert("Nie udało się zapisać lekcji.");
    }
  };

  const handleDelete = async () => {
    if (!editingSlot?.lessonId) {
      return;
    }

    if (!confirm("Na pewno usunąć lekcję?")) {
      return;
    }

    const token = getAccessToken();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/${editingSlot.lessonId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        alert("Nie udało się usunąć lekcji.");
        return;
      }

      setEditingSlot(null);
      onRefresh();
    } catch {
      alert("Nie udało się usunąć lekcji.");
    }
  };

  return (
    <div className="relative">
      <div className="grid w-full grid-cols-[3rem_repeat(5,minmax(0,1fr))] gap-1 text-xs">
        <div />

        {daysMapping.map((day) => (
          <div key={day} className="pb-2 text-center font-semibold">
            {day}
          </div>
        ))}

        {hours.map((hour) => (
          <React.Fragment key={hour}>
            <div className="self-start pr-2 pt-1 text-right font-medium text-gray-500">
              {hour}:00
            </div>

            {daysMapping.map((day, dayIndex) => {
              const slotLessons = lessonsBySlot[day]?.[hour] ?? [];

              return (
                <div
                  key={`${day}-${hour}`}
                  className="group flex min-h-20 flex-col gap-1 overflow-y-auto border bg-white p-1 transition-colors hover:bg-gray-50"
                  onClick={() => handleCellClick(dayIndex, hour)}
                >
                  {slotLessons.length === 0 ? (
                    <div className="flex h-full min-h-16 items-center justify-center text-xl font-bold text-gray-300 opacity-0 group-hover:opacity-100">
                      +
                    </div>
                  ) : (
                    slotLessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        type="button"
                        className="flex w-full border bg-white text-left transition-colors hover:bg-blue-50"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleCellClick(dayIndex, hour, lesson.id);
                        }}
                      >
                        <span className="w-1 shrink-0 bg-blue-500" />
                        <span className="min-w-0 px-2 py-1">
                          <span className="block truncate font-semibold">
                            {lesson.subjectTitle}
                          </span>
                          <span className="block truncate text-gray-500">{lesson.topic}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {editingSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-96 rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">
              {editingSlot.lessonId ? "Edytuj lekcję" : "Dodaj lekcję"} -{" "}
              {fullDayNames[editingSlot.day]}, {editingSlot.hour}:00
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Kurs</label>
                <select
                  className="w-full rounded border p-2"
                  value={formData.course}
                  onChange={(event) => setFormData({ ...formData, course: event.target.value })}
                  required
                >
                  <option value="" disabled>
                    Wybierz kurs...
                  </option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.course_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Temat</label>
                <input
                  type="text"
                  className="w-full rounded border p-2"
                  value={formData.topic}
                  onChange={(event) => setFormData({ ...formData, topic: event.target.value })}
                  required
                  placeholder="Wprowadź temat zajęć"
                />
              </div>

              <div className="mt-4 flex justify-between">
                {editingSlot.lessonId ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-sm font-semibold text-red-600 hover:text-red-800"
                  >
                    Usuń
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="rounded border px-4 py-2 hover:bg-gray-50"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
                  >
                    Zapisz
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Lesson as AdminLesson, Course } from "./ScheduleAdmin";
import { getAccessToken } from "@/lib/auth";
import ScheduleGrid, { Schedule, Lesson as GridLesson } from "@/components/schedule/ScheduleGrid";

const daysMapping = ["Pon", "Wt", "Śr", "Czw", "Pt"];

type Props = {
  lessons: AdminLesson[];
  courses: Course[];
  onRefresh: () => void;
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

  const schedule: Schedule = {};

  lessons.forEach((lesson) => {
    const d = new Date(lesson.date);
    const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
    if (dayIndex < 0 || dayIndex > 4) return;

    const hour = d.getHours();
    const dayName = daysMapping[dayIndex];

    if (!schedule[dayName]) schedule[dayName] = {};

    const courseObj = courses.find((c) => c.id === lesson.course);
    const subjectTitle = courseObj
      ? `${lesson.course_name} (${courseObj.course_code})`
      : lesson.course_name;

    schedule[dayName][hour] = {
      id: lesson.id,
      subject: subjectTitle,
      teacher: lesson.topic,
      status: "default",
    };
  });

  const handleCellClick = (dayIndex: number, hour: number, gridLesson?: GridLesson) => {
    if (gridLesson && gridLesson.id) {
      const originalLesson = lessons.find((l) => l.id === gridLesson.id);
      setEditingSlot({ day: dayIndex, hour, lessonId: gridLesson.id });
      if (originalLesson) {
        setFormData({ course: originalLesson.course.toString(), topic: originalLesson.topic });
      }
    } else {
      setEditingSlot({ day: dayIndex, hour });
      setFormData({ course: "", topic: "" });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSlot) return;

    const token = getAccessToken();
    const isEdit = !!editingSlot.lessonId;

    const now = new Date();
    const targetDayIndex = editingSlot.day + 1;
    const currentDayIndex = now.getDay() === 0 ? 7 : now.getDay();
    let daysToAdd = targetDayIndex - currentDayIndex;
    if (daysToAdd <= 0) daysToAdd += 7;

    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    targetDate.setHours(editingSlot.hour, 0, 0, 0);

    let finalDate = targetDate.toISOString();
    if (isEdit) {
      const originalLesson = lessons.find((l) => l.id === editingSlot.lessonId);
      if (originalLesson) {
        const origDate = new Date(originalLesson.date);
        origDate.setHours(editingSlot.hour, 0, 0, 0);
        const origDayIndex = origDate.getDay() === 0 ? 6 : origDate.getDay() - 1;
        if (origDayIndex !== editingSlot.day) {
          const diff = editingSlot.day - origDayIndex;
          origDate.setDate(origDate.getDate() + diff);
        }
        finalDate = origDate.toISOString();
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
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        alert("Błąd przy zapisywaniu");
        return;
      }

      setEditingSlot(null);
      onRefresh();
    } catch {
      alert("Error");
    }
  };

  const handleDelete = async () => {
    if (!editingSlot?.lessonId) return;
    if (!confirm("Na pewno usunąć lekcję?")) return;

    const token = getAccessToken();
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/${editingSlot.lessonId}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (res.ok) {
        setEditingSlot(null);
        onRefresh();
      }
    } catch {
      alert("Error deleting");
    }
  };

  const fullDayNames = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek"];

  return (
    <div className="relative">
      <ScheduleGrid schedule={schedule} onSlotClick={handleCellClick} />

      {editingSlot && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96">
            <h3 className="text-lg font-bold mb-4">
              {editingSlot.lessonId ? "Edytuj lekcję" : "Dodaj lekcję"} -{" "}
              {fullDayNames[editingSlot.day]}, {editingSlot.hour}:00
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kurs</label>
                <select
                  className="w-full border p-2 rounded"
                  value={formData.course}
                  onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                  required
                >
                  <option value="" disabled>
                    Wybierz kurs...
                  </option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.course_code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temat</label>
                <input
                  type="text"
                  className="w-full border p-2 rounded"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  required
                  placeholder="Wprowadź temat zajęć"
                />
              </div>

              <div className="flex justify-between mt-4">
                {editingSlot.lessonId ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    Usuń
                  </button>
                ) : (
                  <div></div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingSlot(null)}
                    className="px-4 py-2 border rounded hover:bg-gray-50"
                  >
                    Anuluj
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-900"
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

"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import AdminTable, { ColumnDef } from "@/components/ui/AdminTable";

type Lesson = {
  id: number;
  course: number;
  course_name: string;
  topic: string;
  date: string;
};

type Course = {
  id: number;
  name: string;
  course_code: string;
};

export default function LessonsAdmin() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingLessonId, setEditingLessonId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    course: "",
    topic: "",
    date: "",
  });

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

      if (!lessonsRes.ok || !coursesRes.ok) throw new Error("Nie udało się pobrać lekcji.");

      const lessonsData = await lessonsRes.json();
      const coursesData = await coursesRes.json();

      setLessons(lessonsData);
      setCourses(coursesData);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Wystąpił nieznany błąd.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    // Format date for datetime-local input (YYYY-MM-DDTHH:mm)
    const dateObj = new Date(lesson.date);
    const localDate = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    setFormData({
      course: lesson.course.toString(),
      topic: lesson.topic,
      date: localDate,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Na pewno usunąć?")) return;
    const token = getAccessToken();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchData();
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert("Błąd: " + e.message);
      } else {
        alert("Wystąpił nieznany błąd.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAccessToken();
    const isEdit = editingLessonId !== null;
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/${editingLessonId}/`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/lessons/`;
    const method = isEdit ? "PATCH" : "POST";

    const body = {
      course: parseInt(formData.course),
      topic: formData.topic,
      // Convert back to ISO string for backend
      date: new Date(formData.date).toISOString(),
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
        const errorData = await res.json();
        alert("Błąd: " + JSON.stringify(errorData));
        return;
      }

      setEditingLessonId(null);
      setFormData({ course: "", topic: "", date: "" });
      fetchData();
    } catch (e: unknown) {
      if (e instanceof Error) {
        alert("Błąd: " + e.message);
      } else {
        alert("Wystąpił nieznany błąd.");
      }
    }
  };

  if (loading) return <div>Ładowanie...</div>;
  if (error) return <div>Błąd: {error}</div>;

  const columns: ColumnDef<Lesson>[] = [
    { header: "Data i czas", render: (l) => new Date(l.date).toLocaleString() },
    { header: "Kurs", render: (l) => l.course_name },
    { header: "Temat", render: (l) => l.topic },
  ];

  return (
    <div className="flex gap-8">
      <AdminTable
        title="Harmonogram (Lekcje)"
        data={lessons}
        columns={columns}
        keyExtractor={(l) => l.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="flex-1 p-4 border rounded shadow bg-white h-fit">
        <h2 className="text-xl font-bold mb-4">
          {editingLessonId ? "Edytuj Lekcję" : "Dodaj Lekcję"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select
            name="course"
            className="border p-2 rounded"
            value={formData.course}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Wybierz kurs
            </option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.course_code})
              </option>
            ))}
          </select>
          <input
            type="text"
            name="topic"
            placeholder="Temat"
            className="border p-2 rounded"
            value={formData.topic}
            onChange={handleChange}
            required
          />
          <input
            type="datetime-local"
            name="date"
            className="border p-2 rounded"
            value={formData.date}
            onChange={handleChange}
            required
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              {editingLessonId ? "Zapisz" : "Dodaj"}
            </button>
            {editingLessonId && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditingLessonId(null);
                  setFormData({ course: "", topic: "", date: "" });
                }}
              >
                Anuluj
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

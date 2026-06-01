"use client";

import AdminTable, { ColumnDef } from "@/components/ui/AdminTable";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";

type Course = {
  id: number;
  course_code: string;
  name: string;
  description: string;
  teacher: number;
};

type Teacher = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
};

type CourseFormData = {
  course_code: string;
  name: string;
  description: string;
  teacher: string;
};

const emptyFormData: CourseFormData = {
  course_code: "",
  name: "",
  description: "",
  teacher: "",
};

function getTeacherName(teacher?: Teacher): string {
  if (!teacher) {
    return "Brak danych";
  }

  const fullName = `${teacher.first_name} ${teacher.last_name}`.trim();

  return fullName || teacher.email || `Nauczyciel #${teacher.id}`;
}

export default function CoursesAdmin() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const teachersById = useMemo(() => {
    return new Map(teachers.map((teacher) => [teacher.id, teacher]));
  }, [teachers]);

  const fetchData = async () => {
    const token = getAccessToken();

    try {
      setError(null);

      const [coursesRes, teachersRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/teachers/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!coursesRes.ok || !teachersRes.ok) {
        throw new Error("Nie udało się pobrać kursów.");
      }

      const coursesData = (await coursesRes.json()) as Course[];
      const teachersData = (await teachersRes.json()) as Teacher[];

      setCourses(coursesData);
      setTeachers(teachersData);
    } catch (coursesError) {
      setError(coursesError instanceof Error ? coursesError.message : "Wystąpił nieznany błąd.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleEdit = (course: Course) => {
    setEditingCourseId(course.id);
    setFormData({
      course_code: course.course_code,
      name: course.name,
      description: course.description ?? "",
      teacher: String(course.teacher),
    });
  };

  const resetForm = () => {
    setEditingCourseId(null);
    setFormData(emptyFormData);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Na pewno usunąć kurs?")) {
      return;
    }

    const token = getAccessToken();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/courses/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Nie udało się usunąć kursu.");
      }

      await fetchData();
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Wystąpił nieznany błąd.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = getAccessToken();
    const isEdit = editingCourseId !== null;
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/courses/${editingCourseId}/`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/courses/`;

    const body = {
      course_code: formData.course_code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      teacher: Number(formData.teacher),
    };

    try {
      setSaving(true);

      const response = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Nie udało się zapisać kursu (${response.status}). ${errorText}`);
      }

      resetForm();
      await fetchData();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Wystąpił nieznany błąd.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  if (error) {
    return <div>Błąd: {error}</div>;
  }

  const columns: ColumnDef<Course>[] = [
    { header: "Kod", render: (course) => course.course_code },
    { header: "Nazwa", render: (course) => course.name },
    {
      header: "Nauczyciel",
      render: (course) => getTeacherName(teachersById.get(course.teacher)),
    },
    {
      header: "Opis",
      render: (course) => course.description || "Brak opisu",
    },
  ];

  return (
    <div className="flex gap-8">
      <AdminTable
        title="Lista kursów"
        data={courses}
        columns={columns}
        keyExtractor={(course) => course.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="flex-1 p-4 border rounded shadow bg-white h-fit">
        <h2 className="text-xl font-bold mb-4">{editingCourseId ? "Edytuj kurs" : "Dodaj kurs"}</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="course_code"
            placeholder="Kod kursu"
            className="border p-2 rounded"
            value={formData.course_code}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="name"
            placeholder="Nazwa kursu"
            className="border p-2 rounded"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <select
            name="teacher"
            className="border p-2 rounded"
            value={formData.teacher}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Wybierz nauczyciela
            </option>
            {teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {getTeacherName(teacher)}
              </option>
            ))}
          </select>

          <textarea
            name="description"
            placeholder="Opis kursu"
            className="min-h-24 resize-none border p-2 rounded"
            value={formData.description}
            onChange={handleChange}
          />

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? "Zapisywanie..." : editingCourseId ? "Zapisz" : "Dodaj"}
            </button>

            {editingCourseId && (
              <button type="button" className="btn" onClick={resetForm} disabled={saving}>
                Anuluj
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

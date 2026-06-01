"use client";

import AdminTable, { ColumnDef } from "@/components/ui/AdminTable";
import { getAccessToken } from "@/lib/auth";
import { useEffect, useMemo, useState } from "react";

type Student = {
  id: number;
  first_name: string;
  last_name: string;
  pesel: string;
  date_of_birth: string;
  parent: number;
  enrolled_courses: number[];
};

type ParentUser = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
};

type Course = {
  id: number;
  course_code: string;
  name: string;
};

type StudentFormData = {
  first_name: string;
  last_name: string;
  pesel: string;
  date_of_birth: string;
  parent: string;
  enrolled_courses: number[];
};

const emptyFormData: StudentFormData = {
  first_name: "",
  last_name: "",
  pesel: "",
  date_of_birth: "",
  parent: "",
  enrolled_courses: [],
};

function getUserName(user?: ParentUser): string {
  if (!user) {
    return "Brak danych";
  }

  const fullName = `${user.first_name} ${user.last_name}`.trim();

  return fullName || user.email || `Rodzic #${user.id}`;
}

function getCourseLabel(course?: Course): string {
  if (!course) {
    return "Nieznany kurs";
  }

  return `${course.name} (${course.course_code})`;
}

export default function StudentsAdmin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<ParentUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);
  const [formData, setFormData] = useState<StudentFormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parentsById = useMemo(() => {
    return new Map(parents.map((parent) => [parent.id, parent]));
  }, [parents]);

  const coursesById = useMemo(() => {
    return new Map(courses.map((course) => [course.id, course]));
  }, [courses]);

  const fetchData = async () => {
    const token = getAccessToken();

    try {
      setError(null);

      const [studentsRes, usersRes, coursesRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/students/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/manage/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/courses/`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!studentsRes.ok || !usersRes.ok || !coursesRes.ok) {
        throw new Error("Nie udało się pobrać danych uczniów.");
      }

      const studentsData = (await studentsRes.json()) as Student[];
      const usersData = (await usersRes.json()) as ParentUser[];
      const coursesData = (await coursesRes.json()) as Course[];

      setStudents(studentsData);
      setParents(usersData.filter((user) => user.role === "PARENT"));
      setCourses(coursesData);
    } catch (studentsError) {
      setError(studentsError instanceof Error ? studentsError.message : "Wystąpił nieznany błąd.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleCourseToggle = (courseId: number) => {
    setFormData((current) => {
      const isSelected = current.enrolled_courses.includes(courseId);

      return {
        ...current,
        enrolled_courses: isSelected
          ? current.enrolled_courses.filter((id) => id !== courseId)
          : [...current.enrolled_courses, courseId],
      };
    });
  };

  const handleEdit = (student: Student) => {
    setEditingStudentId(student.id);
    setFormData({
      first_name: student.first_name,
      last_name: student.last_name,
      pesel: student.pesel,
      date_of_birth: student.date_of_birth,
      parent: String(student.parent),
      enrolled_courses: student.enrolled_courses ?? [],
    });
  };

  const resetForm = () => {
    setEditingStudentId(null);
    setFormData(emptyFormData);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Na pewno usunąć ucznia?")) {
      return;
    }

    const token = getAccessToken();

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/students/${id}/`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        throw new Error("Nie udało się usunąć ucznia.");
      }

      await fetchData();
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Wystąpił nieznany błąd.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const token = getAccessToken();
    const isEdit = editingStudentId !== null;
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/students/${editingStudentId}/`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/manage/students/`;

    const body = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      pesel: formData.pesel.trim(),
      date_of_birth: formData.date_of_birth,
      parent: Number(formData.parent),
      enrolled_courses: formData.enrolled_courses,
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
        throw new Error(`Nie udało się zapisać ucznia (${response.status}). ${errorText}`);
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

  const columns: ColumnDef<Student>[] = [
    {
      header: "Uczeń",
      render: (student) => `${student.first_name} ${student.last_name}`,
    },
    { header: "PESEL", render: (student) => student.pesel },
    { header: "Data urodzenia", render: (student) => student.date_of_birth },
    {
      header: "Rodzic",
      render: (student) => getUserName(parentsById.get(student.parent)),
    },
    {
      header: "Kursy",
      render: (student) =>
        student.enrolled_courses.length > 0
          ? student.enrolled_courses
              .map((courseId) => getCourseLabel(coursesById.get(courseId)))
              .join(", ")
          : "Brak kursów",
    },
  ];

  return (
    <div className="flex gap-8">
      <AdminTable
        title="Lista uczniów"
        data={students}
        columns={columns}
        keyExtractor={(student) => student.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="flex-1 p-4 border rounded shadow bg-white h-fit">
        <h2 className="text-xl font-bold mb-4">
          {editingStudentId ? "Edytuj ucznia" : "Dodaj ucznia"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="first_name"
            aria-label="Imię"
            placeholder="Imię"
            className="border p-2 rounded"
            value={formData.first_name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="last_name"
            aria-label="Nazwisko"
            placeholder="Nazwisko"
            className="border p-2 rounded"
            value={formData.last_name}
            onChange={handleChange}
            required
          />

          <input
            type="text"
            name="pesel"
            aria-label="PESEL"
            placeholder="PESEL"
            className="border p-2 rounded"
            value={formData.pesel}
            onChange={handleChange}
            required
            minLength={11}
            maxLength={11}
          />

          <input
            type="date"
            name="date_of_birth"
            aria-label="Data urodzenia"
            className="border p-2 rounded"
            value={formData.date_of_birth}
            onChange={handleChange}
            required
          />

          <select
            name="parent"
            aria-label="Rodzic"
            className="border p-2 rounded"
            value={formData.parent}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Wybierz rodzica
            </option>
            {parents.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {getUserName(parent)}
              </option>
            ))}
          </select>

          <fieldset className="rounded border p-3">
            <legend className="px-1 text-sm font-semibold">Kursy ucznia</legend>

            <div className="mt-2 flex max-h-44 flex-col gap-2 overflow-auto">
              {courses.length === 0 ? (
                <div className="text-sm text-gray-500">Brak dostępnych kursów.</div>
              ) : (
                courses.map((course) => (
                  <label key={course.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.enrolled_courses.includes(course.id)}
                      onChange={() => handleCourseToggle(course.id)}
                    />
                    <span>{getCourseLabel(course)}</span>
                  </label>
                ))
              )}
            </div>
          </fieldset>

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? "Zapisywanie..." : editingStudentId ? "Zapisz" : "Dodaj"}
            </button>

            {editingStudentId && (
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

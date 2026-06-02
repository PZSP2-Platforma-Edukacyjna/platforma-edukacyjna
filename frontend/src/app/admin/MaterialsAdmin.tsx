"use client";

import AdminTable, { ColumnDef } from "@/components/ui/AdminTable";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type Course = {
  id: number;
  course_code: string;
  name: string;
};

type LearningMaterial = {
  id: number;
  course: number;
  course_name?: string;
  course_code?: string;
  title: string;
  description: string;
  url: string;
};

type MaterialFormData = {
  course: string;
  title: string;
  description: string;
  url: string;
};

type MaterialPayload = {
  course: number;
  title: string;
  description: string;
  url: string;
};

const emptyFormData: MaterialFormData = {
  course: "",
  title: "",
  description: "",
  url: "",
};

function getCourseLabel(course?: Course): string {
  if (!course) {
    return "Nieznany kurs";
  }

  return `${course.name} (${course.course_code})`;
}

function getMaterialCourseLabel(
  material: LearningMaterial,
  coursesById: Map<number, Course>,
): string {
  const course = coursesById.get(material.course);

  if (course) {
    return getCourseLabel(course);
  }

  if (material.course_name && material.course_code) {
    return `${material.course_name} (${material.course_code})`;
  }

  return `Kurs #${material.course}`;
}

export default function MaterialsAdmin() {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coursesById = useMemo(() => {
    return new Map(courses.map((course) => [course.id, course]));
  }, [courses]);

  const fetchData = async () => {
    try {
      setError(null);

      const [materialsData, coursesData] = await Promise.all([
        apiGet<LearningMaterial[]>("/api/learning-materials/"),
        apiGet<Course[]>("/api/manage/courses/"),
      ]);

      setMaterials(materialsData);
      setCourses(coursesData);
    } catch (materialsError) {
      setError(
        materialsError instanceof Error
          ? materialsError.message
          : "Nie udało się pobrać materiałów.",
      );
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

  const handleEdit = (material: LearningMaterial) => {
    setEditingMaterialId(material.id);
    setFormData({
      course: String(material.course),
      title: material.title,
      description: material.description ?? "",
      url: material.url,
    });
  };

  const resetForm = () => {
    setEditingMaterialId(null);
    setFormData(emptyFormData);
  };

  const buildPayload = (): MaterialPayload => ({
    course: Number(formData.course),
    title: formData.title.trim(),
    description: formData.description.trim(),
    url: formData.url.trim(),
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Na pewno usunąć materiał?")) {
      return;
    }

    try {
      await apiDelete(`/api/learning-materials/${id}/`);
      await fetchData();
    } catch (deleteError) {
      alert(deleteError instanceof Error ? deleteError.message : "Wystąpił nieznany błąd.");
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const payload = buildPayload();

    try {
      setSaving(true);

      if (editingMaterialId) {
        await apiPatch<LearningMaterial, MaterialPayload>(
          `/api/learning-materials/${editingMaterialId}/`,
          payload,
        );
      } else {
        await apiPost<LearningMaterial, MaterialPayload>("/api/learning-materials/", payload);
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

  const columns: ColumnDef<LearningMaterial>[] = [
    { header: "Tytuł", render: (material) => material.title },
    {
      header: "Kurs",
      render: (material) => getMaterialCourseLabel(material, coursesById),
    },
    {
      header: "Opis",
      render: (material) => material.description || "Brak opisu",
    },
    {
      header: "Link",
      render: (material) => (
        <a
          className="font-medium text-blue-700 hover:underline"
          href={material.url}
          rel="noreferrer"
          target="_blank"
        >
          Otwórz
        </a>
      ),
    },
  ];

  return (
    <div className="flex gap-8">
      <AdminTable
        title="Lista materiałów"
        data={materials}
        columns={columns}
        keyExtractor={(material) => material.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="flex-1 p-4 border rounded shadow bg-white h-fit">
        <h2 className="text-xl font-bold mb-4">
          {editingMaterialId ? "Edytuj materiał" : "Dodaj materiał"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <select
            name="course"
            aria-label="Kurs"
            className="border p-2 rounded"
            value={formData.course}
            onChange={handleChange}
            required
          >
            <option value="" disabled>
              Wybierz kurs
            </option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {getCourseLabel(course)}
              </option>
            ))}
          </select>

          <input
            type="text"
            name="title"
            placeholder="Tytuł materiału"
            className="border p-2 rounded"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <input
            type="url"
            name="url"
            placeholder="Adres URL"
            className="border p-2 rounded"
            value={formData.url}
            onChange={handleChange}
            required
          />

          <textarea
            name="description"
            placeholder="Opis materiału"
            className="min-h-24 resize-none border p-2 rounded"
            value={formData.description}
            onChange={handleChange}
          />

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? "Zapisywanie..." : editingMaterialId ? "Zapisz" : "Dodaj"}
            </button>

            {editingMaterialId && (
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

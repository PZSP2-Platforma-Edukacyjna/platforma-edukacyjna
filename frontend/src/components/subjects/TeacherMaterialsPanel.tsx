"use client";

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

type Props = {
  courses: Course[];
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

function getMaterialCourseLabel(material: LearningMaterial, coursesById: Map<number, Course>) {
  const course = coursesById.get(material.course);

  if (course) {
    return getCourseLabel(course);
  }

  if (material.course_name && material.course_code) {
    return `${material.course_name} (${material.course_code})`;
  }

  return `Kurs #${material.course}`;
}

export default function TeacherMaterialsPanel({ courses }: Props) {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [editingMaterialId, setEditingMaterialId] = useState<number | null>(null);
  const [formData, setFormData] = useState<MaterialFormData>(emptyFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const coursesById = useMemo(() => {
    return new Map(courses.map((course) => [course.id, course]));
  }, [courses]);

  const fetchMaterials = async () => {
    try {
      setError(null);
      setMaterials(await apiGet<LearningMaterial[]>("/api/learning-materials/"));
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
    fetchMaterials();
  }, []);

  const resetForm = () => {
    setEditingMaterialId(null);
    setFormData(emptyFormData);
  };

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

  const buildPayload = (): MaterialPayload => ({
    course: Number(formData.course),
    title: formData.title.trim(),
    description: formData.description.trim(),
    url: formData.url.trim(),
  });

  const handleDelete = async (materialId: number) => {
    if (!confirm("Na pewno usunąć materiał?")) {
      return;
    }

    try {
      await apiDelete(`/api/learning-materials/${materialId}/`);
      await fetchMaterials();
      if (editingMaterialId === materialId) {
        resetForm();
      }
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
      await fetchMaterials();
    } catch (saveError) {
      alert(saveError instanceof Error ? saveError.message : "Wystąpił nieznany błąd.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="card flex h-full min-h-0 flex-col gap-3 overflow-auto bg-white">
      <div>
        <h2 className="text-xl font-bold">Moje materiały</h2>
        <p className="mt-1 text-xs text-gray-600">Linki Google Drive dla prowadzonych kursów.</p>
      </div>

      {loading && <div>Ładowanie...</div>}
      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <select
              name="course"
              aria-label="Kurs materiału"
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
              placeholder="Link Google Drive"
              className="border p-2 rounded"
              value={formData.url}
              onChange={handleChange}
              required
            />

            <textarea
              name="description"
              placeholder="Opis materiału"
              className="min-h-20 resize-none border p-2 rounded"
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

          <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
            {materials.length === 0 ? (
              <div className="rounded border bg-gray-50 p-3 text-sm text-gray-600">
                Brak materiałów do wyświetlenia.
              </div>
            ) : (
              materials.map((material) => (
                <article key={material.id} className="rounded border bg-gray-50 p-3 text-sm">
                  <div className="font-semibold">{material.title}</div>
                  <div className="mt-1 text-xs text-gray-600">
                    {getMaterialCourseLabel(material, coursesById)}
                  </div>
                  {material.description && (
                    <div className="mt-2 text-xs text-gray-700">{material.description}</div>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <a
                      className="font-medium text-blue-700 hover:underline"
                      href={material.url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Otwórz
                    </a>
                    <button
                      className="font-medium text-gray-800 hover:underline"
                      type="button"
                      onClick={() => handleEdit(material)}
                    >
                      Edytuj
                    </button>
                    <button
                      className="font-medium text-red-600 hover:underline"
                      type="button"
                      onClick={() => handleDelete(material.id)}
                    >
                      Usuń
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}

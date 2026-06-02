"use client";

import AdminTable, { ColumnDef } from "@/components/ui/AdminTable";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import { useEffect, useState } from "react";

type Announcement = {
  id: number;
  title: string;
  body: string;
  image_url: string;
  date: string;
};

type AnnouncementFormData = {
  title: string;
  body: string;
  image_url: string;
  date: string;
};

type AnnouncementPayload = Omit<AnnouncementFormData, "image_url"> & {
  image_url: string;
};

function toDatetimeLocalValue(value: string): string {
  return value.slice(0, 16);
}

function createEmptyFormData(): AnnouncementFormData {
  return {
    title: "",
    body: "",
    image_url: "",
    date: toDatetimeLocalValue(new Date().toISOString()),
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AnnouncementsAdmin() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [editingAnnouncementId, setEditingAnnouncementId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AnnouncementFormData>(createEmptyFormData);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);
      setAnnouncements(await apiGet<Announcement[]>("/api/announcements/"));
    } catch (announcementsError) {
      setError(
        announcementsError instanceof Error
          ? announcementsError.message
          : "Nie udało się pobrać aktualności.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const resetForm = () => {
    setEditingAnnouncementId(null);
    setFormData(createEmptyFormData());
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncementId(announcement.id);
    setFormData({
      title: announcement.title,
      body: announcement.body,
      image_url: announcement.image_url ?? "",
      date: toDatetimeLocalValue(announcement.date),
    });
  };

  const buildPayload = (): AnnouncementPayload => ({
    title: formData.title.trim(),
    body: formData.body.trim(),
    image_url: formData.image_url.trim(),
    date: formData.date,
  });

  const handleDelete = async (id: number) => {
    if (!confirm("Na pewno usunąć aktualność?")) {
      return;
    }

    try {
      await apiDelete(`/api/announcements/${id}/`);
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

      if (editingAnnouncementId) {
        await apiPatch<Announcement, AnnouncementPayload>(
          `/api/announcements/${editingAnnouncementId}/`,
          payload,
        );
      } else {
        await apiPost<Announcement, AnnouncementPayload>("/api/announcements/", payload);
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

  const columns: ColumnDef<Announcement>[] = [
    { header: "Tytuł", render: (announcement) => announcement.title },
    { header: "Data", render: (announcement) => formatDate(announcement.date) },
    {
      header: "Treść",
      render: (announcement) => announcement.body,
    },
    {
      header: "Grafika",
      render: (announcement) =>
        announcement.image_url ? (
          <a
            className="font-medium text-blue-700 hover:underline"
            href={announcement.image_url}
            rel="noreferrer"
            target="_blank"
          >
            Otwórz
          </a>
        ) : (
          "Domyślna"
        ),
    },
  ];

  return (
    <div className="flex gap-8">
      <AdminTable
        title="Lista aktualności"
        data={announcements}
        columns={columns}
        keyExtractor={(announcement) => announcement.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="flex-1 p-4 border rounded shadow bg-white h-fit">
        <h2 className="text-xl font-bold mb-4">
          {editingAnnouncementId ? "Edytuj aktualność" : "Dodaj aktualność"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            name="title"
            placeholder="Tytuł aktualności"
            className="border p-2 rounded"
            value={formData.title}
            onChange={handleChange}
            required
          />

          <input
            type="datetime-local"
            name="date"
            aria-label="Data aktualności"
            className="border p-2 rounded"
            value={formData.date}
            onChange={handleChange}
            required
          />

          <input
            type="url"
            name="image_url"
            placeholder="Opcjonalny link do grafiki"
            className="border p-2 rounded"
            value={formData.image_url}
            onChange={handleChange}
          />

          <textarea
            name="body"
            placeholder="Treść aktualności"
            className="min-h-28 resize-none border p-2 rounded"
            value={formData.body}
            onChange={handleChange}
            required
          />

          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1" disabled={saving}>
              {saving ? "Zapisywanie..." : editingAnnouncementId ? "Zapisz" : "Dodaj"}
            </button>

            {editingAnnouncementId && (
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

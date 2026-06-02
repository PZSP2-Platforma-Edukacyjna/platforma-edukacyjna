"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/auth";
import AdminTable, { ColumnDef } from "@/components/ui/AdminTable";

type User = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
};

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    role: "PARENT",
    password: "",
  });

  const fetchUsers = async () => {
    const token = getAccessToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/manage/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Nie udało się pobrać użytkowników.");
      const data = await res.json();
      setUsers(data);
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
    fetchUsers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (user: User) => {
    setEditingUserId(user.id);
    setFormData({
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      password: "",
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Na pewno usunąć?")) return;
    const token = getAccessToken();
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/manage/${id}/`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
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
    const isEdit = editingUserId !== null;
    const url = isEdit
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/manage/${editingUserId}/`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/manage/`;
    const method = isEdit ? "PATCH" : "POST";

    const body: Record<string, string> = { ...formData };
    if (!body.password) delete body.password; // Don't send empty password

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

      setEditingUserId(null);
      setFormData({ email: "", first_name: "", last_name: "", role: "PARENT", password: "" });
      fetchUsers();
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

  const columns: ColumnDef<User>[] = [
    { header: "ID", render: (u) => u.id },
    { header: "Email", render: (u) => u.email },
    { header: "Imię i nazwisko", render: (u) => `${u.first_name} ${u.last_name}` },
    { header: "Rola", render: (u) => u.role },
  ];

  return (
    <div className="flex gap-8">
      <AdminTable
        title="Lista Użytkowników"
        data={users}
        columns={columns}
        keyExtractor={(u) => u.id}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <div className="flex-1 p-4 border rounded shadow bg-white h-fit">
        <h2 className="text-xl font-bold mb-4">
          {editingUserId ? "Edytuj Użytkownika" : "Dodaj Użytkownika"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            placeholder="Email"
            className="border p-2 rounded"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="first_name"
            placeholder="Imię"
            className="border p-2 rounded"
            value={formData.first_name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="last_name"
            placeholder="Nazwisko"
            className="border p-2 rounded"
            value={formData.last_name}
            onChange={handleChange}
            required
          />
          <select
            name="role"
            className="border p-2 rounded"
            value={formData.role}
            onChange={handleChange}
          >
            <option value="PARENT">Rodzic</option>
            <option value="TEACHER">Nauczyciel</option>
            <option value="ADMIN">Admin</option>
          </select>
          <input
            type="password"
            name="password"
            placeholder={editingUserId ? "Nowe hasło (opcjonalne)" : "Hasło"}
            className="border p-2 rounded"
            value={formData.password}
            onChange={handleChange}
            required={!editingUserId}
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary flex-1">
              {editingUserId ? "Zapisz" : "Dodaj"}
            </button>
            {editingUserId && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setEditingUserId(null);
                  setFormData({
                    email: "",
                    first_name: "",
                    last_name: "",
                    role: "PARENT",
                    password: "",
                  });
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

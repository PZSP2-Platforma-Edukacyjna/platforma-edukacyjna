"use client";

import TopBar from "@/components/layout/TopBar";
import { apiGet } from "@/lib/api";
import { getUserRole, logout } from "@/lib/auth";
import { formatTokenDate, getAccessTokenPayload } from "@/lib/session";
import type { AccessTokenPayload } from "@/lib/session";
import type { Child, Lesson } from "@/types/school";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

function formatDate(value?: string): string {
  if (!value) {
    return "Brak danych";
  }

  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(value));
}

export default function AccountPage() {
  const router = useRouter();
  const [children, setChildren] = useState<Child[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [role, setRole] = useState<string | null>(null);
  const [tokenPayload, setTokenPayload] = useState<AccessTokenPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const currentRole = getUserRole();

    setRole(currentRole);
    setTokenPayload(getAccessTokenPayload());

    if (currentRole !== "PARENT") {
      setLoading(false);
      return;
    }

    async function loadAccountData() {
      try {
        const [childrenData, lessonsData] = await Promise.all([
          apiGet<Child[]>("/api/my-children/"),
          apiGet<Lesson[]>("/api/my-children/schedule/"),
        ]);

        setChildren(childrenData);
        setLessons(lessonsData);
      } catch (accountError) {
        setError(
          accountError instanceof Error ? accountError.message : "Nie udało się pobrać danych.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadAccountData();
  }, []);

  const upcomingLessons = useMemo(() => {
    const now = Date.now();

    return lessons
      .filter((lesson) => new Date(lesson.date).getTime() >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 4);
  }, [lessons]);

  const courseCount = new Set(children.flatMap((child) => child.enrolled_courses)).size;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />

      <main className="flex-1 p-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Konto użytkownika</h1>
              <p className="text-sm text-gray-600">
                Dane sesji, dzieci i skróty do najważniejszych sekcji.
              </p>
            </div>
            <button type="button" className="btn bg-white" onClick={handleLogout}>
              Wyloguj
            </button>
          </div>

          {error && (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {error}
            </div>
          )}

          <div className={`grid gap-4 ${role === "PARENT" ? "lg:grid-cols-[1fr_1.4fr]" : ""}`}>
            <section className="rounded border bg-white p-4">
              <h2 className="text-lg font-semibold">Profil i sesja</h2>
              <div className="mt-4 grid gap-3 text-sm">
                <div className="flex justify-between gap-4 border-b pb-2">
                  <span className="text-gray-500">ID użytkownika</span>
                  <span className="font-medium">{tokenPayload?.user_id ?? "Brak danych"}</span>
                </div>
                <div className="flex justify-between gap-4 border-b pb-2">
                  <span className="text-gray-500">Typ tokenu</span>
                  <span className="font-medium">{tokenPayload?.token_type ?? "Brak danych"}</span>
                </div>
                <div className="flex justify-between gap-4 border-b pb-2">
                  <span className="text-gray-500">Rola</span>
                  <span className="font-medium">{role ?? "Brak danych"}</span>
                </div>
                <div className="flex justify-between gap-4 border-b pb-2">
                  <span className="text-gray-500">Aktywna do</span>
                  <span className="font-medium text-right">
                    {formatTokenDate(tokenPayload?.exp)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-gray-500">Liczba dzieci</span>
                  <span className="font-medium">{loading ? "..." : children.length}</span>
                </div>
              </div>
            </section>

            {role === "PARENT" && (
              <section className="rounded border bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Dzieci pod opieką</h2>
                  <span className="rounded border px-3 py-1 text-sm">
                    {courseCount} aktywnych kursów
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {loading && <div className="text-sm text-gray-600">Ładowanie...</div>}
                  {!loading &&
                    children.map((child) => (
                      <div key={child.id} className="rounded border p-3">
                        <div className="font-semibold">
                          {child.first_name} {child.last_name}
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          Data urodzenia: {formatDate(child.date_of_birth)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Kursy: {child.enrolled_courses.length}
                        </div>
                      </div>
                    ))}
                  {!loading && children.length === 0 && (
                    <div className="text-sm text-gray-600">Brak dzieci przypisanych do konta.</div>
                  )}
                </div>
              </section>
            )}
          </div>

          <div className={`grid gap-4 ${role === "PARENT" ? "lg:grid-cols-[1.2fr_1fr]" : ""}`}>
            {role === "PARENT" && (
              <section className="rounded border bg-white p-4">
                <h2 className="text-lg font-semibold">Najbliższe zajęcia</h2>
                <div className="mt-4 divide-y">
                  {upcomingLessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className="flex flex-wrap justify-between gap-3 py-3 text-sm"
                    >
                      <div>
                        <div className="font-medium">{lesson.course_name}</div>
                        <div className="text-gray-600">{lesson.topic}</div>
                      </div>
                      <div className="text-right text-gray-600">
                        {new Intl.DateTimeFormat("pl-PL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(lesson.date))}
                      </div>
                    </div>
                  ))}
                  {!loading && upcomingLessons.length === 0 && (
                    <div className="py-3 text-sm text-gray-600">Brak nadchodzących zajęć.</div>
                  )}
                </div>
              </section>
            )}

            <section className="rounded border bg-white p-4">
              <h2 className="text-lg font-semibold">Szybkie akcje</h2>
              <div className="mt-4 grid gap-3">
                <Link className="btn bg-white text-center" href="/messages">
                  Otwórz wiadomości
                </Link>
                {role === "PARENT" && (
                  <Link className="btn bg-white text-center" href="/payments">
                    Przejdź do płatności
                  </Link>
                )}
                <Link className="btn bg-white text-center" href="/dashboard">
                  Wróć do panelu
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import TopBar from "@/components/layout/TopBar";
import { apiGet } from "@/lib/api";
import type { Child } from "@/types/school";
import { useEffect, useMemo, useState } from "react";

type BackendPaymentStatus = "PENDING" | "COMPLETED" | "FAILED";

type BackendPayment = {
  id: number;
  course: number;
  course_name: string;
  course_code: string;
  amount: string;
  status: BackendPaymentStatus;
  date: string;
};

const statusLabels: Record<BackendPaymentStatus, string> = {
  PENDING: "Oczekująca",
  COMPLETED: "Zakończona",
  FAILED: "Nieudana",
};

function formatMoney(value: string | number): string {
  const numericValue = typeof value === "string" ? Number(value) : value;

  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(numericValue);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStoredSelectedChildId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem("selectedChildId");

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
}

function storeSelectedChildId(childId: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("selectedChildId", String(childId));
}

function getInitialSelectedChild(children: Child[]): Child | null {
  const storedChildId = getStoredSelectedChildId();

  return children.find((child) => child.id === storedChildId) ?? children[0] ?? null;
}

function getStatusClass(status: BackendPaymentStatus): string {
  if (status === "COMPLETED") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "FAILED") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-yellow-200 bg-yellow-50 text-yellow-700";
}

export default function PaymentsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [payments, setPayments] = useState<BackendPayment[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        const [paymentsData, childrenData] = await Promise.all([
          apiGet<BackendPayment[]>("/api/payments/"),
          apiGet<Child[]>("/api/my-children/").catch(() => []),
        ]);

        setPayments(paymentsData);
        setChildren(childrenData);
        setSelectedChild(getInitialSelectedChild(childrenData));
        setError(null);
      } catch (paymentsError) {
        setError(
          paymentsError instanceof Error
            ? paymentsError.message
            : "Nie udało się pobrać danych płatności.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  const childScopedPayments = useMemo(() => {
    if (!selectedChild) {
      return payments;
    }

    const childCourseIds = new Set(selectedChild.enrolled_courses);

    return payments.filter((payment) => childCourseIds.has(payment.course));
  }, [payments, selectedChild]);

  const visiblePayments = useMemo(() => {
    if (selectedCourseId === "all") {
      return childScopedPayments;
    }

    return childScopedPayments.filter((payment) => payment.course === selectedCourseId);
  }, [childScopedPayments, selectedCourseId]);

  const courseOptions = useMemo(() => {
    const coursesById = new Map<number, string>();

    for (const payment of childScopedPayments) {
      coursesById.set(payment.course, `${payment.course_code} - ${payment.course_name}`);
    }

    return Array.from(coursesById.entries()).map(([id, label]) => ({
      id,
      label,
    }));
  }, [childScopedPayments]);

  const handleSelectChild = (child: Child) => {
    setSelectedChild(child);
    storeSelectedChildId(child.id);
    setSelectedCourseId("all");
  };

  const pendingTotal = visiblePayments
    .filter((payment) => payment.status === "PENDING")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const completedTotal = visiblePayments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const failedTotal = visiblePayments
    .filter((payment) => payment.status === "FAILED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar
        childList={children}
        selectedChild={selectedChild}
        onSelectChild={handleSelectChild}
      />

      <main className="flex-1 p-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">Płatności</h1>
            <p className="text-sm text-gray-600">Historia płatności pobrana z backendu.</p>
          </div>

          {error && (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded border bg-white p-4">
              <div className="text-sm text-gray-500">Oczekujące</div>
              <div className="mt-2 text-2xl font-bold">{formatMoney(pendingTotal)}</div>
            </section>

            <section className="rounded border bg-white p-4">
              <div className="text-sm text-gray-500">Zakończone</div>
              <div className="mt-2 text-2xl font-bold">{formatMoney(completedTotal)}</div>
            </section>

            <section className="rounded border bg-white p-4">
              <div className="text-sm text-gray-500">Nieudane</div>
              <div className="mt-2 text-2xl font-bold">{formatMoney(failedTotal)}</div>
            </section>
          </div>

          <section className="min-w-0 rounded border bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Historia płatności</h2>

              <select
                className="form-input w-auto min-w-64"
                value={selectedCourseId}
                onChange={(event) =>
                  setSelectedCourseId(
                    event.target.value === "all" ? "all" : Number(event.target.value),
                  )
                }
              >
                <option value="all">Wszystkie kursy</option>

                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-4 max-w-full overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b bg-gray-100">
                    <th className="p-2">Kurs</th>
                    <th className="p-2">Kod</th>
                    <th className="p-2">Data</th>
                    <th className="p-2">Status</th>
                    <th className="p-2 text-right">Kwota</th>
                  </tr>
                </thead>

                <tbody>
                  {loading && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={5}>
                        Ładowanie...
                      </td>
                    </tr>
                  )}

                  {!loading &&
                    visiblePayments.map((payment) => (
                      <tr key={payment.id} className="border-b">
                        <td className="p-2 font-medium">{payment.course_name}</td>
                        <td className="p-2">{payment.course_code}</td>
                        <td className="p-2">{formatDate(payment.date)}</td>
                        <td className="p-2">
                          <span
                            className={`rounded border px-2 py-1 text-xs ${getStatusClass(
                              payment.status,
                            )}`}
                          >
                            {statusLabels[payment.status]}
                          </span>
                        </td>
                        <td className="p-2 text-right font-semibold">
                          {formatMoney(payment.amount)}
                        </td>
                      </tr>
                    ))}

                  {!loading && visiblePayments.length === 0 && (
                    <tr>
                      <td className="p-3 text-gray-600" colSpan={5}>
                        Brak płatności do wyświetlenia.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

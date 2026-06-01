"use client";

import { apiGet, apiPatch } from "@/lib/api";
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
  user?: number;
  user_email?: string;
  user_name?: string;
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
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
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

function getPayerLabel(payment: BackendPayment): string {
  if (payment.user_name) {
    return payment.user_name;
  }

  if (payment.user_email) {
    return payment.user_email;
  }

  if (payment.user) {
    return `Użytkownik #${payment.user}`;
  }

  return "Brak danych";
}

export default function PaymentsAdmin() {
  const [payments, setPayments] = useState<BackendPayment[]>([]);
  const [statusFilter, setStatusFilter] = useState<BackendPaymentStatus | "all">("all");
  const [courseFilter, setCourseFilter] = useState<number | "all">("all");
  const [search, setSearch] = useState("");
  const [savingPaymentId, setSavingPaymentId] = useState<number | null>(null);
  const [statusUpdateError, setStatusUpdateError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPayments() {
      try {
        const paymentsData = await apiGet<BackendPayment[]>("/api/payments/");

        setPayments(paymentsData);
        setError(null);
      } catch (paymentsError) {
        setError(
          paymentsError instanceof Error
            ? paymentsError.message
            : "Nie udało się pobrać płatności.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadPayments();
  }, []);

  const courseOptions = useMemo(() => {
    const coursesById = new Map<number, string>();

    for (const payment of payments) {
      coursesById.set(payment.course, `${payment.course_code} - ${payment.course_name}`);
    }

    return Array.from(coursesById.entries()).map(([id, label]) => ({ id, label }));
  }, [payments]);

  const filteredPayments = useMemo(() => {
    const phrase = search.trim().toLowerCase();

    return payments.filter((payment) => {
      const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
      const matchesCourse = courseFilter === "all" || payment.course === courseFilter;
      const payer = getPayerLabel(payment).toLowerCase();
      const matchesSearch =
        !phrase ||
        payment.course_name.toLowerCase().includes(phrase) ||
        payment.course_code.toLowerCase().includes(phrase) ||
        payer.includes(phrase);

      return matchesStatus && matchesCourse && matchesSearch;
    });
  }, [courseFilter, payments, search, statusFilter]);

  const pendingTotal = filteredPayments
    .filter((payment) => payment.status === "PENDING")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const completedTotal = filteredPayments
    .filter((payment) => payment.status === "COMPLETED")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  const failedCount = filteredPayments.filter((payment) => payment.status === "FAILED").length;

  const handleStatusChange = async (paymentId: number, status: BackendPaymentStatus) => {
    try {
      setSavingPaymentId(paymentId);
      setStatusUpdateError(null);

      const updatedPayment = await apiPatch<BackendPayment, { status: BackendPaymentStatus }>(
        `/api/payments/${paymentId}/`,
        { status },
      );

      setPayments((currentPayments) =>
        currentPayments.map((payment) =>
          payment.id === paymentId ? { ...payment, ...updatedPayment } : payment,
        ),
      );
    } catch (updateError) {
      setStatusUpdateError(
        updateError instanceof Error
          ? updateError.message
          : "Nie udało się zmienić statusu płatności.",
      );
    } finally {
      setSavingPaymentId(null);
    }
  };

  if (loading) {
    return <div>Ładowanie...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-bold">Płatności</h2>
        <p className="mt-1 text-sm text-gray-600">
          Podgląd historii płatności pobranej z backendu dla konta administratora.
        </p>
      </div>

      {error && (
        <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
          {error}
        </div>
      )}

      {statusUpdateError && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {statusUpdateError}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <section className="rounded border bg-white p-4">
          <div className="text-sm text-gray-500">Liczba płatności</div>
          <div className="mt-2 text-2xl font-bold">{filteredPayments.length}</div>
        </section>

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
          <div className="mt-2 text-2xl font-bold">{failedCount}</div>
        </section>
      </div>

      <section className="rounded border bg-white p-4">
        <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
          <input
            className="form-input"
            placeholder="Szukaj po kursie lub użytkowniku"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Status płatności"
            className="form-input"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as BackendPaymentStatus | "all")
            }
          >
            <option value="all">Wszystkie statusy</option>
            <option value="PENDING">Oczekujące</option>
            <option value="COMPLETED">Zakończone</option>
            <option value="FAILED">Nieudane</option>
          </select>

          <select
            aria-label="Kurs"
            className="form-input"
            value={courseFilter}
            onChange={(event) =>
              setCourseFilter(event.target.value === "all" ? "all" : Number(event.target.value))
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
          <table className="w-full min-w-[840px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b bg-gray-100">
                <th className="p-2">ID</th>
                <th className="p-2">Użytkownik</th>
                <th className="p-2">Kurs</th>
                <th className="p-2">Kod</th>
                <th className="p-2">Data</th>
                <th className="p-2">Status</th>
                <th className="p-2">Zmień status</th>
                <th className="p-2 text-right">Kwota</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">#{payment.id}</td>
                  <td className="p-2">{getPayerLabel(payment)}</td>
                  <td className="p-2">{payment.course_name}</td>
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
                  <td className="p-2">
                    <select
                      aria-label={`Zmień status płatności #${payment.id}`}
                      className="form-input min-w-36"
                      value={payment.status}
                      disabled={savingPaymentId === payment.id}
                      onChange={(event) =>
                        handleStatusChange(payment.id, event.target.value as BackendPaymentStatus)
                      }
                    >
                      <option value="PENDING">Oczekująca</option>
                      <option value="COMPLETED">Zakończona</option>
                      <option value="FAILED">Nieudana</option>
                    </select>
                  </td>
                  <td className="p-2 text-right font-semibold">{formatMoney(payment.amount)}</td>
                </tr>
              ))}

              {filteredPayments.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-600" colSpan={8}>
                    Brak płatności do wyświetlenia.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

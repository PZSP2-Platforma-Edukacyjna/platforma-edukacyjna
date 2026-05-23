"use client";

import TopBar from "@/components/layout/TopBar";
import { apiGet } from "@/lib/api";
import type { Child } from "@/types/school";
import { useEffect, useMemo, useState } from "react";

type PaymentStatus = "paid" | "due" | "planned" | "late";

type Payment = {
  id: string;
  childId: number;
  childName: string;
  title: string;
  dueDate: string;
  amount: number;
  status: PaymentStatus;
};

const fallbackChildren: Child[] = [
  {
    id: 1,
    first_name: "Jan",
    last_name: "Kowalski",
    enrolled_courses: [1, 2, 3],
  },
];

const statusLabels: Record<PaymentStatus, string> = {
  due: "Do zapłaty",
  late: "Po terminie",
  paid: "Opłacone",
  planned: "Zaplanowane",
};

function buildPayments(children: Child[]): Payment[] {
  const source = children.length > 0 ? children : fallbackChildren;
  const now = new Date();
  const monthName = new Intl.DateTimeFormat("pl-PL", { month: "long" }).format(now);
  const year = now.getFullYear();

  return source.flatMap((child, index) => {
    const childName = `${child.first_name} ${child.last_name}`;
    const dueDate = new Date(year, now.getMonth(), 28 - index).toISOString();
    const paidDate = new Date(year, now.getMonth(), 8 + index).toISOString();

    return [
      {
        id: `${child.id}-tuition`,
        childId: child.id,
        childName,
        title: `Czesne - ${monthName}`,
        dueDate,
        amount: 180 + index * 20,
        status: "due" as const,
      },
      {
        id: `${child.id}-materials`,
        childId: child.id,
        childName,
        title: "Materiały dydaktyczne",
        dueDate: paidDate,
        amount: 45,
        status: "paid" as const,
      },
    ];
  });
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(value);
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", { dateStyle: "medium" }).format(new Date(value));
}

export default function PaymentsPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>(buildPayments([]));
  const [selectedChildId, setSelectedChildId] = useState<number | "all">("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [method, setMethod] = useState("Przelew online");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPaymentsContext() {
      try {
        const childrenData = await apiGet<Child[]>("/api/my-children/");

        setChildren(childrenData);
        setPayments(buildPayments(childrenData));
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

    loadPaymentsContext();
  }, []);

  const visiblePayments = useMemo(() => {
    if (selectedChildId === "all") {
      return payments;
    }

    return payments.filter((payment) => payment.childId === selectedChildId);
  }, [payments, selectedChildId]);

  const unpaidPayments = visiblePayments.filter((payment) => payment.status !== "paid");
  const selectedTotal = visiblePayments
    .filter((payment) => selectedIds.includes(payment.id) && payment.status !== "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);
  const outstandingTotal = unpaidPayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidTotal = visiblePayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + payment.amount, 0);

  const togglePayment = (paymentId: string) => {
    setSelectedIds((current) =>
      current.includes(paymentId)
        ? current.filter((id) => id !== paymentId)
        : [...current, paymentId],
    );
  };

  const markSelectedAsPlanned = () => {
    setPayments((current) =>
      current.map((payment) =>
        selectedIds.includes(payment.id) && payment.status !== "paid"
          ? { ...payment, status: "planned" }
          : payment,
      ),
    );
    setSelectedIds([]);
  };

  const markSelectedAsPaid = () => {
    setPayments((current) =>
      current.map((payment) =>
        selectedIds.includes(payment.id) ? { ...payment, status: "paid" } : payment,
      ),
    );
    setSelectedIds([]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />

      <main className="flex-1 p-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">Płatności</h1>
            <p className="text-sm text-gray-600">Saldo, należności i historia wpłat dla dzieci.</p>
          </div>

          {error && (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {error}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <section className="rounded border bg-white p-4">
              <div className="text-sm text-gray-500">Do zapłaty</div>
              <div className="mt-2 text-2xl font-bold">{formatMoney(outstandingTotal)}</div>
            </section>
            <section className="rounded border bg-white p-4">
              <div className="text-sm text-gray-500">Opłacone</div>
              <div className="mt-2 text-2xl font-bold">{formatMoney(paidTotal)}</div>
            </section>
            <section className="rounded border bg-white p-4">
              <div className="text-sm text-gray-500">Wybrane</div>
              <div className="mt-2 text-2xl font-bold">{formatMoney(selectedTotal)}</div>
            </section>
          </div>

          <div className="grid min-w-0 gap-4 lg:grid-cols-[1fr_320px]">
            <section className="min-w-0 rounded border bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Należności</h2>
                <select
                  className="form-input w-auto min-w-48"
                  value={selectedChildId}
                  onChange={(event) =>
                    setSelectedChildId(
                      event.target.value === "all" ? "all" : Number(event.target.value),
                    )
                  }
                >
                  <option value="all">Wszystkie dzieci</option>
                  {children.map((child) => (
                    <option key={child.id} value={child.id}>
                      {child.first_name} {child.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4 max-w-full overflow-x-auto">
                <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b bg-gray-100">
                      <th className="p-2">Wybierz</th>
                      <th className="p-2">Pozycja</th>
                      <th className="p-2">Dziecko</th>
                      <th className="p-2">Termin</th>
                      <th className="p-2">Status</th>
                      <th className="p-2 text-right">Kwota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td className="p-3 text-gray-600" colSpan={6}>
                          Ładowanie...
                        </td>
                      </tr>
                    )}
                    {!loading &&
                      visiblePayments.map((payment) => (
                        <tr key={payment.id} className="border-b">
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(payment.id)}
                              disabled={payment.status === "paid"}
                              onChange={() => togglePayment(payment.id)}
                            />
                          </td>
                          <td className="p-2 font-medium">{payment.title}</td>
                          <td className="p-2">{payment.childName}</td>
                          <td className="p-2">{formatDate(payment.dueDate)}</td>
                          <td className="p-2">
                            <span className="rounded border px-2 py-1 text-xs">
                              {statusLabels[payment.status]}
                            </span>
                          </td>
                          <td className="p-2 text-right font-semibold">
                            {formatMoney(payment.amount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>

            <aside className="rounded border bg-white p-4">
              <h2 className="text-lg font-semibold">Płatność</h2>

              <label htmlFor="method" className="mt-4 block text-sm font-medium text-gray-700">
                Metoda
              </label>
              <select
                id="method"
                className="form-input mt-2"
                value={method}
                onChange={(event) => setMethod(event.target.value)}
              >
                <option>Przelew online</option>
                <option>Przelew tradycyjny</option>
                <option>BLIK</option>
              </select>

              <div className="mt-4 rounded border bg-gray-50 p-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span>Wybrano</span>
                  <span>{selectedIds.length}</span>
                </div>
                <div className="mt-2 flex justify-between gap-3 font-semibold">
                  <span>Razem</span>
                  <span>{formatMoney(selectedTotal)}</span>
                </div>
              </div>

              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  className="btn bg-gray-800 text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedTotal === 0}
                  onClick={markSelectedAsPlanned}
                >
                  Zaplanuj płatność
                </button>
                <button
                  type="button"
                  className="btn bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={selectedTotal === 0}
                  onClick={markSelectedAsPaid}
                >
                  Oznacz jako opłacone
                </button>
              </div>

              <div className="mt-4 text-xs text-gray-500">Wybrana metoda: {method}</div>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useState } from "react";
import CoursesAdmin from "./CoursesAdmin";
import LessonsAdmin from "./LessonsAdmin";
import PaymentsAdmin from "./PaymentsAdmin";
import ScheduleAdmin from "./ScheduleAdmin";
import UsersAdmin from "./UsersAdmin";

type TabId = "users" | "courses" | "lessons" | "schedule" | "payments";

const TABS: { id: TabId; label: string }[] = [
  { id: "users", label: "Użytkownicy" },
  { id: "courses", label: "Kursy" },
  { id: "lessons", label: "Lekcje (Lista)" },
  { id: "schedule", label: "Plan Lekcji" },
  { id: "payments", label: "Płatności" },
];

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <section className="flex h-full min-h-0 flex-col gap-4">
      <h1 className="text-2xl font-bold">Panel Administratora</h1>

      <div className="flex flex-wrap gap-4 border-b pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`cursor-pointer border-b-2 px-1 pb-1 font-semibold transition-all ${
              activeTab === tab.id
                ? "border-black text-black"
                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-black"
            }`}
            type="button"
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        {activeTab === "users" && <UsersAdmin />}
        {activeTab === "courses" && <CoursesAdmin />}
        {activeTab === "lessons" && <LessonsAdmin />}
        {activeTab === "schedule" && <ScheduleAdmin />}
        {activeTab === "payments" && <PaymentsAdmin />}
      </div>
    </section>
  );
}

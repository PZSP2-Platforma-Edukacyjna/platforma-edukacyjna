"use client";

import { useState } from "react";
import LessonsAdmin from "./LessonsAdmin";
import ScheduleAdmin from "./ScheduleAdmin";
import UsersAdmin from "./UsersAdmin";

type TabId = "users" | "lessons" | "schedule";

const TABS: { id: TabId; label: string }[] = [
  { id: "users", label: "Użytkownicy" },
  { id: "lessons", label: "Lekcje (Lista)" },
  { id: "schedule", label: "Plan Lekcji" },
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
        {activeTab === "lessons" && <LessonsAdmin />}
        {activeTab === "schedule" && <ScheduleAdmin />}
      </div>
    </section>
  );
}

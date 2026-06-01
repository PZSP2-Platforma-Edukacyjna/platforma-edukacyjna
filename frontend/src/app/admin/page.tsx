"use client";

import TopBar from "@/components/layout/TopBar";
import { useState } from "react";
import UsersAdmin from "./UsersAdmin";
import LessonsAdmin from "./LessonsAdmin";
import ScheduleAdmin from "./ScheduleAdmin";
import PaymentsAdmin from "./PaymentsAdmin";
import CoursesAdmin from "./CoursesAdmin";

type TabId = "users" | "courses" | "lessons" | "schedule" | "payments";

const TABS: { id: TabId; label: string }[] = [
  { id: "users", label: "Użytkownicy" },
  { id: "courses", label: "Kursy" },
  { id: "lessons", label: "Lekcje (Lista)" },
  { id: "schedule", label: "Plan Lekcji" },
  { id: "payments", label: "Płatności" },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("users");

  return (
    <div className="h-screen flex flex-col">
      <TopBar isAdmin={true} />
      <div className="flex flex-1 p-4 flex-col gap-4">
        <h1 className="text-2xl font-bold">Panel Administratora</h1>

        <div className="flex gap-4 border-b pb-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`font-semibold border-b-2 px-1 pb-1 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "text-black border-black"
                  : "text-gray-500 border-transparent hover:text-black hover:border-gray-300"
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "users" && <UsersAdmin />}
          {activeTab === "courses" && <CoursesAdmin />}
          {activeTab === "lessons" && <LessonsAdmin />}
          {activeTab === "schedule" && <ScheduleAdmin />}
          {activeTab === "payments" && <PaymentsAdmin />}
        </div>
      </div>
    </div>
  );
}

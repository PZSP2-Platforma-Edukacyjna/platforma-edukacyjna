"use client";

import TopBar from "@/components/layout/TopBar";
import { useState } from "react";
import UsersAdmin from "./UsersAdmin";
import LessonsAdmin from "./LessonsAdmin";
import ScheduleAdmin from "./ScheduleAdmin";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<"users" | "lessons" | "schedule">("users");

  return (
    <div className="h-screen flex flex-col">
      <TopBar isAdmin={true} />
      <div className="flex flex-1 p-4 flex-col gap-4">
        <h1 className="text-2xl font-bold">Panel Administratora</h1>

        <div className="flex gap-4 border-b pb-2">
          <button
            className={`font-semibold ${activeTab === "users" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("users")}
          >
            Użytkownicy
          </button>
          <button
            className={`font-semibold ${activeTab === "lessons" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("lessons")}
          >
            Lekcje (Lista)
          </button>
          <button
            className={`font-semibold ${activeTab === "schedule" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
            onClick={() => setActiveTab("schedule")}
          >
            Plan Lekcji
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          {activeTab === "users" && <UsersAdmin />}
          {activeTab === "lessons" && <LessonsAdmin />}
          {activeTab === "schedule" && <ScheduleAdmin />}
        </div>
      </div>
    </div>
  );
}

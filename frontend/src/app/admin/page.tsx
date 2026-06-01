"use client";

import AdminPanel from "./AdminPanel";
import TopBar from "@/components/layout/TopBar";

export default function AdminDashboard() {
  return (
    <div className="h-screen flex flex-col">
      <TopBar isAdmin={true} />
      <main className="flex min-h-0 flex-1 flex-col p-4">
        <AdminPanel />
      </main>
    </div>
  );
}

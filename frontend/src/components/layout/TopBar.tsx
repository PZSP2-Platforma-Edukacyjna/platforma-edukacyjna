"use client";

import { Child } from "@/app/dashboard/page";

type Props = {
  childList: Child[];
  selectedChild: Child | null;
  onSelectChild: (child: Child) => void;
};

export default function TopBar({
  childList,
  selectedChild,
  onSelectChild,
}: Props) {
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  };

  return (
    <div className="flex justify-between items-center p-4 border-b bg-white">
      <div className="flex gap-3">
        {childList.map((child) => (
          <div
            key={child.id}
            className={`btn h-10 flex items-center justify-center text-sm group min-w-[100px] max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis ${
              selectedChild?.id === child.id ? "btn-primary" : ""
            }`}
            onClick={() => onSelectChild(child)}
          >
            {child.first_name} {child.last_name}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <div className="btn">Konto</div>

        <button
          className="btn"
          onClick={handleLogout}
        >
          Wyloguj
        </button>
      </div>
    </div>
  );
}
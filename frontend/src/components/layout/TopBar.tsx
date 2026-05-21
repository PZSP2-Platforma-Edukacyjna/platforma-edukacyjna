"use client";

import { Child } from "@/app/dashboard/page";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = {
  childList?: Child[];
  selectedChild?: Child | null;
  onSelectChild?: (child: Child) => void;
  isAdmin?: boolean;
};

export default function TopBar({
  childList = [],
  selectedChild = null,
  onSelectChild = () => {},
  isAdmin = false,
}: Props) {
  const pathname = usePathname();
  const isOnAdminPage = pathname?.startsWith("/admin");

  return (
    <div className="flex justify-between items-center p-4 border-b bg-white">
      <div className="flex gap-3">
        {childList.map((child) => (
          <div
            key={child.id}
            className={`btn h-10 flex items-center justify-center text-sm group min-w-[100px] max-w-[150px] overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer ${
              selectedChild?.id === child.id ? "btn-primary" : ""
            }`}
            onClick={() => onSelectChild(child)}
          >
            {child.first_name} {child.last_name}
          </div>
        ))}
      </div>

      <div className="flex gap-4 items-center">
        {isAdmin && (
          <Link href={isOnAdminPage ? "/dashboard" : "/admin"} className="btn btn-primary">
            {isOnAdminPage ? "Strona główna" : "Panel Administratora"}
          </Link>
        )}
        <div className="btn">Konto</div>
      </div>
    </div>
  );
}

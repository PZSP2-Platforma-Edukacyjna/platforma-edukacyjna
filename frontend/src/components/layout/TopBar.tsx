"use client";

import { getUserRole, logout } from "@/lib/auth";
import type { Child } from "@/types/school";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Props = {
  childList?: Child[];
  selectedChild?: Child | null;
  onSelectChild?: (child: Child) => void;
  isAdmin?: boolean;
};

type NavItem = {
  href: string;
  label: string;
};

function getNavItems(role: string | null, isAdmin: boolean): NavItem[] {
  if (isAdmin || role === "ADMIN") {
    return [{ href: "/admin", label: "Panel Administratora" }];
  }

  if (role === "TEACHER") {
    return [
      { href: "/dashboard", label: "Panel" },
      { href: "/messages", label: "Wiadomości" },
      { href: "/account", label: "Konto" },
    ];
  }

  if (role === "PARENT") {
    return [
      { href: "/dashboard", label: "Panel" },
      { href: "/messages", label: "Wiadomości" },
      { href: "/payments", label: "Płatności" },
      { href: "/account", label: "Konto" },
    ];
  }

  return [{ href: "/dashboard", label: "Panel" }];
}

export default function TopBar({
  childList = [],
  selectedChild = null,
  onSelectChild = () => {},
  isAdmin = false,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();

  const role = getUserRole();
  const navItems = getNavItems(role, isAdmin);

  const shouldShowChildren = role === "PARENT" && childList.length > 0;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4">
      <div className="flex min-w-0 flex-wrap items-center gap-3">
        {shouldShowChildren ? (
          childList.map((child) => (
            <button
              key={child.id}
              type="button"
              aria-pressed={selectedChild?.id === child.id}
              className={`btn flex h-10 min-w-[100px] max-w-[150px] items-center justify-center overflow-hidden text-ellipsis whitespace-nowrap text-sm ${
                selectedChild?.id === child.id
                  ? "border-black bg-gray-800 text-white hover:bg-gray-900"
                  : "bg-white"
              }`}
              onClick={() => onSelectChild(child)}
            >
              {child.first_name} {child.last_name}
            </button>
          ))
        ) : (
          <Link href="/dashboard" className="whitespace-nowrap font-semibold">
            Platforma edukacyjna
          </Link>
        )}
      </div>

      <nav className="flex flex-wrap items-center gap-2">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href === "/admin" && pathname?.startsWith("/admin"));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`btn flex h-10 items-center ${
                isActive ? "border-black bg-gray-800 text-white hover:bg-gray-900" : "bg-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}

        <button type="button" className="btn h-10 bg-white" onClick={handleLogout}>
          Wyloguj
        </button>
      </nav>
    </div>
  );
}
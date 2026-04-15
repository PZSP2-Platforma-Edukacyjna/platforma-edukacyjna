"use client";

import { useEffect, useState } from "react";
import { getAccessToken, isUserLoggedIn } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface Child {
  id: number;
  first_name: string;
  last_name: string;
}

export default function TopBar() {
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchChildren() {
      if (!isUserLoggedIn()) {
        router.push("/login");
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const token = getAccessToken();
        const response = await fetch("http://localhost:8000/api/my-children/", {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid
            router.push("/login");
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: Child[] = await response.json();
        setChildren(data);
      } catch (e: unknown) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError("An unknown error occurred");
        }
        console.error("Failed to fetch children:", e);
      } finally {
        setLoading(false);
      }
    }

    fetchChildren();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <div className="text-gray-500">Loading children...</div>
        <div className="btn">Konto</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-between items-center p-4 border-b bg-white">
        <div className="text-red-500">Error: {error}</div>
        <div className="btn">Konto</div>
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center p-4 border-b bg-white">
      <div className="flex gap-3">
        {children.map((child) => (
          <div
            key={child.id}
            className="btn"
          >
            {child.first_name} {child.last_name}
          </div>
        ))}
      </div>

      <div className="btn">Konto</div>
    </div>
  );
}

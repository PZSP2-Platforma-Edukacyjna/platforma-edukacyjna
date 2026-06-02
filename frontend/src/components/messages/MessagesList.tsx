"use client";

import { apiGet } from "@/lib/api";
import { useEffect, useMemo, useState } from "react";

type BackendMessage = {
  id: number;
  sender_name: string;
  recipient_name: string;
  body: string;
  created_at: string;
  is_mine: boolean;
};

type DashboardMessage = {
  id: string;
  sender: string;
  date: string;
  text: string;
};

function EnvelopeIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <rect height="16" rx="2" width="20" x="2" y="4" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

const fallbackMessages: DashboardMessage[] = [
  {
    id: "fallback-physics",
    sender: "teacher@mail.com",
    date: "2026-04-10",
    text: "Sprawdzian z fizyki w piątek",
  },
  {
    id: "fallback-office",
    sender: "sekretariat@mail.com",
    date: "2026-04-12",
    text: "Przypomnienie o zebraniu z rodzicami",
  },
  {
    id: "fallback-materials",
    sender: "math.teacher@mail.com",
    date: "2026-04-14",
    text: "Nowe materiały są dostępne w kursie",
  },
  {
    id: "fallback-payment",
    sender: "admin@mail.com",
    date: "2026-04-16",
    text: "Płatność za zajęcia została odnotowana",
  },
];

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function mapBackendMessage(message: BackendMessage): DashboardMessage {
  return {
    id: String(message.id),
    sender: message.is_mine ? `Ty do ${message.recipient_name}` : message.sender_name,
    date: formatDate(message.created_at),
    text: message.body,
  };
}

export default function MessagesList() {
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadMessages() {
      try {
        const backendMessages = await apiGet<BackendMessage[]>("/api/users/messages/");

        if (!isMounted) {
          return;
        }

        const latestMessages = [...backendMessages]
          .sort(
            (left, right) =>
              new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
          )
          .slice(0, 4)
          .map(mapBackendMessage);

        setMessages(latestMessages);
        setUseFallback(false);
      } catch {
        if (isMounted) {
          setMessages(fallbackMessages);
          setUseFallback(true);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadMessages();

    return () => {
      isMounted = false;
    };
  }, []);

  const emptyMessage = useMemo(() => {
    if (loading) {
      return "Ładowanie wiadomości...";
    }

    if (useFallback) {
      return null;
    }

    return "Brak wiadomości. Nowe rozmowy pojawią się tutaj po wysłaniu.";
  }, [loading, useFallback]);

  return (
    <div className="flex h-full gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-white text-gray-800">
        <EnvelopeIcon />
      </div>

      <div className="card flex-1 overflow-y-auto bg-white">
        {emptyMessage && messages.length === 0 && (
          <div className="p-2 text-sm text-gray-600">{emptyMessage}</div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="card mb-3 text-sm">
            <div className="font-semibold">{message.sender}</div>
            <div className="text-xs">{message.date}</div>
            <div>{message.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

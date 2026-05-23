"use client";

import TopBar from "@/components/layout/TopBar";
import { apiGet } from "@/lib/api";
import type { Child, Lesson, Teacher } from "@/types/school";
import { FormEvent, useEffect, useMemo, useState } from "react";

type Message = {
  id: string;
  author: "parent" | "teacher" | "school";
  authorName: string;
  body: string;
  sentAt: string;
};

type Conversation = {
  id: string;
  title: string;
  subtitle: string;
  messages: Message[];
  unread: number;
};

const fallbackConversations: Conversation[] = [
  {
    id: "secretariat",
    title: "Sekretariat",
    subtitle: "Sprawy organizacyjne",
    unread: 1,
    messages: [
      {
        id: "secretariat-1",
        author: "school",
        authorName: "Sekretariat",
        body: "Przypominamy o aktualizacji danych kontaktowych w panelu rodzica.",
        sentAt: "2026-05-21T09:20:00",
      },
    ],
  },
  {
    id: "math",
    title: "Anna Nowak",
    subtitle: "Matematyka",
    unread: 0,
    messages: [
      {
        id: "math-1",
        author: "teacher",
        authorName: "Anna Nowak",
        body: "Dzień dobry, kolejny sprawdzian obejmuje tematy z ostatnich trzech lekcji.",
        sentAt: "2026-05-20T14:30:00",
      },
    ],
  },
];

function buildConversations(teachers: Teacher[], lessons: Lesson[]): Conversation[] {
  if (teachers.length === 0) {
    return fallbackConversations;
  }

  return teachers.map((teacher, index) => {
    const lesson = lessons.find((item) => item.teacher === teacher.id);
    const subject = lesson?.course_name ?? "Nauczyciel";

    return {
      id: `teacher-${teacher.id}`,
      title: `${teacher.first_name} ${teacher.last_name}`,
      subtitle: subject,
      unread: index === 0 ? 1 : 0,
      messages: [
        {
          id: `teacher-${teacher.id}-intro`,
          author: "teacher",
          authorName: `${teacher.first_name} ${teacher.last_name}`,
          body: lesson
            ? `Dzień dobry, najbliższy temat zajęć to: ${lesson.topic}.`
            : "Dzień dobry, proszę o kontakt w razie pytań dotyczących zajęć.",
          sentAt: lesson?.date ?? new Date().toISOString(),
        },
      ],
    };
  });
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function MessagesPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>(fallbackConversations);
  const [selectedId, setSelectedId] = useState(fallbackConversations[0].id);
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMessagesContext() {
      try {
        const [childrenData, teachersData, lessonsData] = await Promise.all([
          apiGet<Child[]>("/api/my-children/"),
          apiGet<Teacher[]>("/api/users/teachers/"),
          apiGet<Lesson[]>("/api/my-children/schedule/"),
        ]);
        const nextConversations = buildConversations(teachersData, lessonsData);

        setChildren(childrenData);
        setConversations(nextConversations);
        setSelectedId(nextConversations[0]?.id ?? fallbackConversations[0].id);
      } catch (messagesError) {
        setError(
          messagesError instanceof Error
            ? messagesError.message
            : "Nie udało się pobrać danych wiadomości.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadMessagesContext();
  }, []);

  const filteredConversations = useMemo(() => {
    const phrase = search.trim().toLowerCase();

    if (!phrase) {
      return conversations;
    }

    return conversations.filter(
      (conversation) =>
        conversation.title.toLowerCase().includes(phrase) ||
        conversation.subtitle.toLowerCase().includes(phrase),
    );
  }, [conversations, search]);

  const selectedConversation =
    conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message || !selectedConversation) {
      return;
    }

    const nextMessage: Message = {
      id: `local-${Date.now()}`,
      author: "parent",
      authorName: "Ty",
      body: message,
      sentAt: new Date().toISOString(),
    };

    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === selectedConversation.id
          ? { ...conversation, messages: [...conversation.messages, nextMessage], unread: 0 }
          : conversation,
      ),
    );
    setDraft("");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar />

      <main className="flex-1 p-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">Wiadomości</h1>
            <p className="text-sm text-gray-600">
              Rozmowy z nauczycielami i sekretariatem w jednym miejscu.
            </p>
          </div>

          {error && (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {error}
            </div>
          )}

          <div className="grid min-h-[620px] gap-4 lg:grid-cols-[320px_1fr]">
            <aside className="rounded border bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Rozmowy</h2>
                <span className="text-sm text-gray-500">{children.length} dzieci</span>
              </div>

              <input
                className="form-input mt-3"
                placeholder="Szukaj"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="mt-3 flex flex-col gap-2">
                {loading && <div className="p-2 text-sm text-gray-600">Ładowanie...</div>}
                {!loading &&
                  filteredConversations.map((conversation) => (
                    <button
                      key={conversation.id}
                      type="button"
                      className={`rounded border p-3 text-left hover:bg-gray-100 ${
                        selectedConversation?.id === conversation.id
                          ? "border-black bg-gray-100"
                          : "bg-white"
                      }`}
                      onClick={() => setSelectedId(conversation.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{conversation.title}</span>
                        {conversation.unread > 0 && (
                          <span className="rounded bg-gray-800 px-2 py-1 text-xs text-white">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-sm text-gray-600">{conversation.subtitle}</div>
                    </button>
                  ))}
              </div>
            </aside>

            <section className="flex min-h-[620px] flex-col rounded border bg-white">
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">{selectedConversation?.title}</h2>
                <div className="text-sm text-gray-600">{selectedConversation?.subtitle}</div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {selectedConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.author === "parent" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded border p-3 text-sm ${
                        message.author === "parent" ? "bg-gray-900 text-white" : "bg-gray-50"
                      }`}
                    >
                      <div className="mb-1 text-xs opacity-80">
                        {message.authorName} - {formatDate(message.sentAt)}
                      </div>
                      <div>{message.body}</div>
                    </div>
                  </div>
                ))}
              </div>

              <form className="border-t p-4" onSubmit={handleSubmit}>
                <label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Nowa wiadomość
                </label>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <textarea
                    id="message"
                    className="form-input min-h-24 flex-1 resize-none"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="Napisz wiadomość"
                  />
                  <button
                    type="submit"
                    className="btn h-12 bg-gray-800 text-white hover:bg-gray-900"
                  >
                    Wyślij
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

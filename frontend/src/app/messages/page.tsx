"use client";

import TopBar from "@/components/layout/TopBar";
import { apiGet, apiPost } from "@/lib/api";
import { getUserRole } from "@/lib/auth";
import type { Child, Lesson, Teacher } from "@/types/school";
import { FormEvent, useEffect, useMemo, useState } from "react";

type CreateMessageRequest = {
  recipient: number;
  body: string;
};

type BackendMessage = {
  id: number;
  sender: number;
  sender_name: string;
  recipient: number;
  recipient_name: string;
  body: string;
  created_at: string;
  read_at: string | null;
  is_mine: boolean;
};

type Message = {
  id: string;
  author: "me" | "other";
  authorName: string;
  body: string;
  sentAt: string;
};

type Contact = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role?: string;
};

type Conversation = {
  id: string;
  recipientId: number;
  title: string;
  subtitle: string;
  messages: Message[];
  unread: number;
};

function getContactName(contact: Contact): string {
  const fullName = `${contact.first_name} ${contact.last_name}`.trim();

  return fullName || contact.email;
}

function getStoredSelectedChildId(): number | null {
  if (typeof window === "undefined") {
    return null;
  }

  const value = window.localStorage.getItem("selectedChildId");

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isNaN(parsed) ? null : parsed;
}

function storeSelectedChildId(childId: number): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem("selectedChildId", String(childId));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("pl-PL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function backendMessageToFrontendMessage(message: BackendMessage): Message {
  return {
    id: String(message.id),
    author: message.is_mine ? "me" : "other",
    authorName: message.is_mine ? "Ty" : message.sender_name,
    body: message.body,
    sentAt: message.created_at,
  };
}

function teacherToContact(teacher: Teacher): Contact {
  return {
    id: teacher.id,
    first_name: teacher.first_name,
    last_name: teacher.last_name,
    email: "email" in teacher ? String(teacher.email) : "",
    role: "TEACHER",
  };
}

function getTeacherIdsForChild(child: Child | null, lessons: Lesson[]): Set<number> {
  if (!child) {
    return new Set();
  }

  const childCourseIds = new Set(child.enrolled_courses);

  return new Set(
    lessons
      .filter((lesson) => childCourseIds.has(lesson.course))
      .map((lesson) => lesson.teacher),
  );
}

function getSubtitleForParentContact(
  contactId: number,
  selectedChild: Child | null,
  lessons: Lesson[],
): string {
  if (!selectedChild) {
    return "Nauczyciel";
  }

  const childCourseIds = new Set(selectedChild.enrolled_courses);

  const lesson = lessons.find(
    (item) => childCourseIds.has(item.course) && item.teacher === contactId,
  );

  return lesson?.course_name ?? "Nauczyciel";
}

function buildConversationsFromMessagesAndContacts(
  contacts: Contact[],
  backendMessages: BackendMessage[],
  getSubtitle: (contactId: number) => string,
  manualContactId: number | null,
): Conversation[] {
  const contactsById = new Map<number, Contact>();

  for (const contact of contacts) {
    contactsById.set(contact.id, contact);
  }

  const conversationsByContactId = new Map<number, Conversation>();

  for (const backendMessage of backendMessages) {
    const otherUserId = backendMessage.is_mine
      ? backendMessage.recipient
      : backendMessage.sender;

    const contact = contactsById.get(otherUserId);

    if (!contact) {
      continue;
    }

    const frontendMessage = backendMessageToFrontendMessage(backendMessage);
    const existingConversation = conversationsByContactId.get(otherUserId);

    if (existingConversation) {
      existingConversation.messages.push(frontendMessage);
    } else {
      conversationsByContactId.set(otherUserId, {
        id: `user-${otherUserId}`,
        recipientId: otherUserId,
        title: getContactName(contact),
        subtitle: getSubtitle(otherUserId),
        unread: 0,
        messages: [frontendMessage],
      });
    }
  }

  if (manualContactId !== null && !conversationsByContactId.has(manualContactId)) {
    const contact = contactsById.get(manualContactId);

    if (contact) {
      conversationsByContactId.set(manualContactId, {
        id: `user-${manualContactId}`,
        recipientId: manualContactId,
        title: getContactName(contact),
        subtitle: getSubtitle(manualContactId),
        unread: 0,
        messages: [],
      });
    }
  }

  return Array.from(conversationsByContactId.values())
    .map((conversation) => ({
      ...conversation,
      messages: [...conversation.messages].sort(
        (left, right) =>
          new Date(left.sentAt).getTime() - new Date(right.sentAt).getTime(),
      ),
    }))
    .sort((left, right) => {
      const leftLastMessage = left.messages[left.messages.length - 1];
      const rightLastMessage = right.messages[right.messages.length - 1];

      if (!leftLastMessage && !rightLastMessage) {
        return left.title.localeCompare(right.title);
      }

      if (!leftLastMessage) {
        return 1;
      }

      if (!rightLastMessage) {
        return -1;
      }

      return (
        new Date(rightLastMessage.sentAt).getTime() -
        new Date(leftLastMessage.sentAt).getTime()
      );
    });
}

export default function MessagesPage() {
  const [role, setRole] = useState<string | null>(null);

  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [allContacts, setAllContacts] = useState<Contact[]>([]);
  const [backendMessages, setBackendMessages] = useState<BackendMessage[]>([]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [manualContactId, setManualContactId] = useState<number | null>(null);

  const [search, setSearch] = useState("");
  const [selectedContactValue, setSelectedContactValue] = useState("");
  const [draft, setDraft] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableContacts = useMemo(() => {
    if (role !== "PARENT") {
      return allContacts;
    }

    if (!selectedChild) {
      return [];
    }

    const teacherIdsForChild = getTeacherIdsForChild(selectedChild, lessons);

    return allContacts.filter((contact) => teacherIdsForChild.has(contact.id));
  }, [allContacts, lessons, role, selectedChild]);

  const conversations = useMemo(() => {
    return buildConversationsFromMessagesAndContacts(
      availableContacts,
      backendMessages,
      (contactId) => {
        if (role === "PARENT") {
          return getSubtitleForParentContact(contactId, selectedChild, lessons);
        }

        return "Rozmowa";
      },
      manualContactId,
    );
  }, [availableContacts, backendMessages, lessons, manualContactId, role, selectedChild]);

  useEffect(() => {
    if (conversations.length === 0) {
      setSelectedId(null);
      return;
    }

    const selectedConversationStillExists = conversations.some(
      (conversation) => conversation.id === selectedId,
    );

    if (!selectedConversationStillExists) {
      setSelectedId(conversations[0].id);
    }
  }, [conversations, selectedId]);

  useEffect(() => {
    async function loadMessagesContext() {
      try {
        const currentRole = getUserRole();

        setRole(currentRole);

        const messagesData = await apiGet<BackendMessage[]>("/api/users/messages/");
        setBackendMessages(messagesData);

        if (currentRole === "PARENT") {
          const [childrenData, teachersData, lessonsData] = await Promise.all([
            apiGet<Child[]>("/api/my-children/"),
            apiGet<Teacher[]>("/api/users/teachers/"),
            apiGet<Lesson[]>("/api/my-children/schedule/"),
          ]);

          const storedChildId = getStoredSelectedChildId();

          const initialSelectedChild =
            childrenData.find((child) => child.id === storedChildId) ??
            childrenData[0] ??
            null;

          setChildren(childrenData);
          setSelectedChild(initialSelectedChild);
          setLessons(lessonsData);
          setAllContacts(teachersData.map(teacherToContact));
          setError(null);
          return;
        }

        if (currentRole === "TEACHER") {
          const contactsData = await apiGet<Contact[]>("/api/users/contacts/");

          setChildren([]);
          setSelectedChild(null);
          setLessons([]);
          setAllContacts(contactsData);
          setError(null);
          return;
        }

        const contactsData = await apiGet<Contact[]>("/api/users/contacts/");

        setChildren([]);
        setSelectedChild(null);
        setLessons([]);
        setAllContacts(contactsData);
        setError(null);
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
    conversations.find((conversation) => conversation.id === selectedId) ?? null;

  const handleSelectChild = (child: Child) => {
    storeSelectedChildId(child.id);
    setSelectedChild(child);
    setManualContactId(null);
    setSelectedContactValue("");
    setSelectedId(null);
  };

  const handleStartConversation = (contactId: number) => {
    setManualContactId(contactId);
    setSelectedId(`user-${contactId}`);
    setSelectedContactValue(String(contactId));
    setDraft("");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const message = draft.trim();

    if (!message || !selectedConversation) {
      return;
    }

    try {
      setSending(true);

      const savedMessage = await apiPost<BackendMessage, CreateMessageRequest>(
        "/api/users/messages/",
        {
          recipient: selectedConversation.recipientId,
          body: message,
        },
      );

      setBackendMessages((current) => [...current, savedMessage]);
      setManualContactId(null);
      setDraft("");
      setError(null);
    } catch (sendError) {
      setError(
        sendError instanceof Error
          ? sendError.message
          : "Nie udało się wysłać wiadomości.",
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <TopBar
        childList={children}
        selectedChild={selectedChild}
        onSelectChild={handleSelectChild}
        isAdmin={role === "ADMIN"}
      />

      <main className="flex-1 p-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <div>
            <h1 className="text-2xl font-bold">Wiadomości</h1>
            <p className="text-sm text-gray-600">
              Rozmowy zapisane w systemie oraz kontakty dostępne dla Twojej roli.
            </p>
          </div>

          {error && (
            <div className="rounded border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
              {error}
            </div>
          )}

          {role === "PARENT" && children.length > 0 && (
            <div className="rounded border bg-white p-3">
              <label htmlFor="child" className="text-sm font-medium text-gray-700">
                Wybrane dziecko
              </label>

              <select
                id="child"
                className="form-input mt-2 max-w-sm"
                value={selectedChild?.id ?? ""}
                onChange={(event) => {
                  const childId = Number(event.target.value);
                  const child = children.find((item) => item.id === childId);

                  if (child) {
                    handleSelectChild(child);
                  }
                }}
              >
                {children.map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid min-h-[620px] gap-4 lg:grid-cols-[320px_1fr]">
            <aside className="rounded border bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-semibold">Rozmowy</h2>

                <span className="text-sm text-gray-500">
                  {role === "PARENT"
                    ? selectedChild
                      ? `${selectedChild.first_name} ${selectedChild.last_name}`
                      : "brak dziecka"
                    : role === "TEACHER"
                      ? "konto nauczyciela"
                      : "konto użytkownika"}
                </span>
              </div>

              <div className="mt-3">
                <label htmlFor="contact" className="text-sm font-medium text-gray-700">
                  Nowa rozmowa
                </label>

                <select
                  id="contact"
                  className="form-input mt-1"
                  value={selectedContactValue}
                  onChange={(event) => {
                    const contactId = Number(event.target.value);

                    if (!contactId) {
                      setSelectedContactValue("");
                      return;
                    }

                    handleStartConversation(contactId);
                  }}
                  disabled={availableContacts.length === 0}
                >
                  <option value="">Wybierz kontakt</option>

                  {availableContacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {getContactName(contact)}
                    </option>
                  ))}
                </select>
              </div>

              <input
                className="form-input mt-3"
                placeholder="Szukaj rozmowy"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="mt-3 flex flex-col gap-2">
                {loading && (
                  <div className="p-2 text-sm text-gray-600">Ładowanie...</div>
                )}

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
                      onClick={() => {
                        setSelectedId(conversation.id);
                        setSelectedContactValue(String(conversation.recipientId));
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold">{conversation.title}</span>

                        {conversation.unread > 0 && (
                          <span className="rounded bg-gray-800 px-2 py-1 text-xs text-white">
                            {conversation.unread}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-sm text-gray-600">
                        {conversation.subtitle}
                      </div>
                    </button>
                  ))}

                {!loading && filteredConversations.length === 0 && (
                  <div className="p-2 text-sm text-gray-600">
                    Brak rozmów do wyświetlenia. Wybierz kontakt z listy, aby rozpocząć.
                  </div>
                )}
              </div>
            </aside>

            <section className="flex min-h-[620px] flex-col rounded border bg-white">
              <div className="border-b p-4">
                <h2 className="text-lg font-semibold">
                  {selectedConversation?.title ?? "Brak wybranej rozmowy"}
                </h2>

                <div className="text-sm text-gray-600">
                  {selectedConversation?.subtitle ??
                    "Wybierz rozmowę albo kontakt z listy po lewej stronie."}
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {selectedConversation?.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.author === "me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[75%] rounded border p-3 text-sm ${
                        message.author === "me"
                          ? "bg-gray-900 text-white"
                          : "bg-gray-50"
                      }`}
                    >
                      <div className="mb-1 text-xs opacity-80">
                        {message.authorName} - {formatDate(message.sentAt)}
                      </div>

                      <div>{message.body}</div>
                    </div>
                  </div>
                ))}

                {!selectedConversation && (
                  <div className="text-sm text-gray-600">
                    Brak aktywnej rozmowy.
                  </div>
                )}

                {selectedConversation &&
                  selectedConversation.messages.length === 0 && (
                    <div className="text-sm text-gray-600">
                      Brak wiadomości w tej rozmowie. Napisz pierwszą wiadomość.
                    </div>
                  )}
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
                    placeholder={
                      selectedConversation
                        ? "Napisz wiadomość"
                        : "Najpierw wybierz rozmowę albo kontakt"
                    }
                    disabled={sending || !selectedConversation}
                  />

                  <button
                    type="submit"
                    className="btn h-12 bg-gray-800 text-white hover:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={sending || !selectedConversation}
                  >
                    {sending ? "Wysyłanie..." : "Wyślij"}
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
"use client";

import { apiGet } from "@/lib/api";
import { ReactNode, useEffect, useState } from "react";

type BackendAnnouncement = {
  id: number;
  title: string;
  body: string;
  image_url?: string;
  date: string;
};

type NewsItem = {
  key: string;
  title: string;
  description: string;
  imageUrl?: string;
  icon: ReactNode;
  imageClass: string;
};

function MegaphoneIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m3 11 18-5v12L3 14v-3Z" />
      <path d="M11.6 16.8 13 21H9l-1.8-5.4" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect height="18" rx="2" width="18" x="3" y="4" />
      <path d="M3 10h18" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M12 7v14" />
      <path d="M3 18a2 2 0 0 1 2-2h7V5H5a2 2 0 0 0-2 2v11Z" />
      <path d="M21 18a2 2 0 0 0-2-2h-7V5h7a2 2 0 0 1 2 2v11Z" />
    </svg>
  );
}

const visualStyles = [
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
  "bg-sky-50 text-sky-700",
];

const icons = [
  <MapPinIcon key="map" />,
  <CalendarIcon key="calendar" />,
  <BookOpenIcon key="book" />,
];

const fallbackNewsItems: NewsItem[] = [
  {
    key: "fallback-trip",
    title: "Nowa wycieczka szkolna",
    description: "Zapisy dla uczniów są już dostępne.",
    icon: icons[0],
    imageClass: visualStyles[0],
  },
  {
    key: "fallback-meeting",
    title: "Zebranie z rodzicami",
    description: "Spotkanie odbędzie się w przyszłym tygodniu.",
    icon: icons[1],
    imageClass: visualStyles[1],
  },
  {
    key: "fallback-materials",
    title: "Nowe materiały",
    description: "Dodano materiały z Google Drive do ostatnich lekcji.",
    icon: icons[2],
    imageClass: visualStyles[2],
  },
];

function mapAnnouncementToNewsItem(announcement: BackendAnnouncement, index: number): NewsItem {
  const visualIndex = index % visualStyles.length;

  return {
    key: String(announcement.id),
    title: announcement.title,
    description: announcement.body,
    imageUrl: announcement.image_url,
    icon: icons[visualIndex],
    imageClass: visualStyles[visualIndex],
  };
}

export default function NewsList() {
  const [newsItems, setNewsItems] = useState<NewsItem[]>(fallbackNewsItems);

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      try {
        const announcements = await apiGet<BackendAnnouncement[]>("/api/announcements/");

        if (isMounted && announcements.length > 0) {
          setNewsItems(announcements.map(mapAnnouncementToNewsItem));
        }
      } catch {
        if (isMounted) {
          setNewsItems(fallbackNewsItems);
        }
      }
    }

    loadAnnouncements();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex h-full gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-white text-gray-800">
        <MegaphoneIcon />
      </div>

      <div className="card flex-1 overflow-y-auto bg-white">
        {newsItems.map((item) => (
          <div key={item.key} className="card mb-3 flex gap-3">
            <div
              className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border ${item.imageClass}`}
            >
              {item.imageUrl ? (
                <div
                  aria-hidden="true"
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${item.imageUrl})` }}
                />
              ) : (
                item.icon
              )}
            </div>
            <div className="min-w-0 text-sm">
              <div className="font-semibold">{item.title}</div>
              <div className="mt-1 text-xs text-gray-600">{item.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

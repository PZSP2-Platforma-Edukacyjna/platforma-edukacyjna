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

export default function MessagesList() {
  return (
    <div className="flex h-full gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-white text-gray-800">
        <EnvelopeIcon />
      </div>

      <div className="card flex-1 overflow-y-auto bg-white">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card mb-3 text-sm">
            <div className="font-semibold">teacher@mail.com</div>
            <div className="text-xs">2026-04-10</div>
            <div>Sprawdzian w piątek</div>
          </div>
        ))}
      </div>
    </div>
  );
}

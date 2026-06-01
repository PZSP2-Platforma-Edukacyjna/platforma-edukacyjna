function MegaphoneIcon() {
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
      <path d="m3 11 18-5v12L3 14v-3Z" />
      <path d="M11.6 16.8 13 21H9l-1.8-5.4" />
    </svg>
  );
}

export default function NewsList() {
  return (
    <div className="flex h-full gap-2">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border bg-white text-gray-800">
        <MegaphoneIcon />
      </div>

      <div className="card flex-1 overflow-y-auto bg-white">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card mb-3 flex gap-2">
            <div className="h-16 w-16 shrink-0 border bg-white"></div>
            <div className="text-sm">Nowa wycieczka szkolna</div>
          </div>
        ))}
      </div>
    </div>
  );
}

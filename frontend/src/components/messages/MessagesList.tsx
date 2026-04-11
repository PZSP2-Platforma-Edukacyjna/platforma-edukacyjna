export default function MessagesList() {
  return (
    <div className="flex gap-2 h-full">
      <div className="w-8 h-8 bg-black rounded self-start"></div>

      <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="mb-3 border p-2 text-sm">
            <div className="font-semibold">teacher@mail.com</div>
            <div className="text-xs">2026-04-10</div>
            <div>Sprawdzian w piątek</div>
          </div>
        ))}
      </div>
    </div>
  );
}
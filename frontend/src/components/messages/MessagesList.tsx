export default function MessagesList() {
  return (
    <div className="flex gap-2 h-full">
      <div className="w-8 h-8 bg-black rounded self-start"></div>

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
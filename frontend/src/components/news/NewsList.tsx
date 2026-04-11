export default function NewsList() {
  return (
    <div className="flex gap-2 h-full">
      <div className="w-8 h-8 bg-black rounded self-start"></div>

      <div className="flex-1 overflow-y-auto border rounded p-2 bg-white">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2 mb-3 border p-2">
            <div className="w-16 h-16 bg-black"></div>
            <div className="text-sm">Nowa wycieczka szkolna</div>
          </div>
        ))}
      </div>
    </div>
  );
}
export default function NewsList() {
  return (
    <div className="flex gap-2 h-full">
      <div className="w-8 h-8 bg-black rounded self-start"></div>

      <div className="card flex-1 overflow-y-auto bg-white">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card flex gap-2 mb-3">
            <div className="w-16 h-16 bg-black"></div>
            <div className="text-sm">Nowa wycieczka szkolna</div>
          </div>
        ))}
      </div>
    </div>
  );
}

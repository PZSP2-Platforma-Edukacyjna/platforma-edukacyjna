export default function TopBar() {
  return (
    <div className="flex justify-between items-center p-4 border-b bg-white">
      <div className="flex gap-3">
        {["Jan Kowalski", "Anna Kowalska"].map((child, i) => (
          <div
            key={i}
            className="border rounded p-2 px-4 cursor-pointer hover:bg-gray-100"
          >
            {child}
          </div>
        ))}
      </div>

      <div className="border rounded px-4 py-2">Konto</div>
    </div>
  );
}
export default function TopBar() {
  return (
    <div className="flex justify-between items-center p-4 border-b bg-white">
      <div className="flex gap-3">
        {["Jan Kowalski", "Anna Kowalska"].map((child, i) => (
          <div
            key={i}
            className="btn"
          >
            {child}
          </div>
        ))}
      </div>

      <div className="btn">Konto</div>
    </div>
  );
}
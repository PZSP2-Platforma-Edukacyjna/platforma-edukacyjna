export default function SubjectsList() {
  const subjects = [
    { name: "Matematyka", teacher: "Anna Nowak" },
    { name: "Fizyka", teacher: "Krzysztof Kowalski" },
    { name: "Chemia", teacher: "Paweł Lewandowski" },
    { name: "Biologia", teacher: "Joanna Mazur" },
    { name: "Historia", teacher: "Marek Wiśniewski" },
    { name: "Geografia", teacher: "Tomasz Zieliński" },
    { name: "Język Angielski", teacher: "Piotr Pszeniczny" },
    { name: "Informatyka", teacher: "Piotr Kaczmarek" },
    { name: "Wychowanie fizyczne", teacher: "Adam Nowicki" },
    { name: "Muzyka", teacher: "Michał Dąbrowski" },
  ];

  return (
    <div className="h-full overflow-y-auto bg-white border rounded p-2">
      {subjects.map((s, i) => (
        <div
          key={i}
          className="mb-3 p-3 border rounded h-20 flex flex-col justify-center cursor-pointer hover:bg-gray-100"
        >
          <div className="font-semibold">{s.name}</div>
          <div className="text-xs text-gray-500">{s.teacher}</div>
        </div>
      ))}
    </div>
  );
}
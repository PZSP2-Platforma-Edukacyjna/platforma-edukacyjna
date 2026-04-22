type Props = {
  subject?: string;
  teacher?: string;
  status?: "present" | "absent" | "excused";
};

export default function ScheduleTile({ subject, teacher, status }: Props) {
  if (!subject) {
    return <div className="border h-16 bg-white"></div>;
  }

  const color =
    status === "present" ? "bg-green-500" : status === "absent" ? "bg-red-500" : "bg-yellow-500";

  return (
    <div className="flex border h-16 bg-white">
      <div className={`w-1 ${color}`}></div>

      <div className="flex flex-col justify-center px-2 text-xs">
        <span className="font-semibold">{subject}</span>
        <span className="text-gray-500">{teacher}</span>
      </div>
    </div>
  );
}

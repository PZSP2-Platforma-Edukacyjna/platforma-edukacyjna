type Props = {
  subject?: string;
  teacher?: string;
  status?: "present" | "absent" | "excused" | "default";
  onClick?: () => void;
};

export default function ScheduleTile({ subject, teacher, status = "default", onClick }: Props) {
  if (!subject) {
    return (
      <div
        className={`border h-16 bg-white transition-colors ${onClick ? "cursor-pointer hover:bg-gray-50 flex items-center justify-center group" : ""}`}
        onClick={onClick}
      >
        {onClick && (
          <span className="text-gray-300 font-bold text-xl opacity-0 group-hover:opacity-100">
            +
          </span>
        )}
      </div>
    );
  }

  let color = "bg-blue-500";
  if (status === "present") color = "bg-green-500";
  if (status === "absent") color = "bg-red-500";
  if (status === "excused") color = "bg-yellow-500";

  return (
    <div
      className={`flex border h-16 bg-white transition-colors ${onClick ? "cursor-pointer hover:bg-gray-50" : ""}`}
      onClick={onClick}
    >
      <div className={`w-1 ${color}`}></div>

      <div className="flex flex-col justify-center px-2 text-xs overflow-hidden">
        <span className="font-semibold line-clamp-1">{subject}</span>
        <span className="text-gray-500 line-clamp-1">{teacher}</span>
      </div>
    </div>
  );
}

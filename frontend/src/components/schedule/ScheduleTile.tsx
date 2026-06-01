type Props = {
  subject?: string;
  teacher?: string;
  status?: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE" | "default";
  onClick?: () => void;
};

const STATUS_COLORS: Record<string, string> = {
  PRESENT: "bg-green-500",
  ABSENT: "bg-red-500",
  EXCUSED: "bg-yellow-500",
  LATE: "bg-orange-500",
  default: "bg-blue-500",
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

  const color = status ? STATUS_COLORS[status] || "bg-blue-500" : "bg-blue-500";

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

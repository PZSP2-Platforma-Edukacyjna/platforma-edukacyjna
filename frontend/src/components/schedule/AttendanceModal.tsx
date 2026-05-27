import React, { useState, useEffect } from "react";
import { getAccessToken } from "@/lib/auth";
import type { Attendance, Child } from "@/types/school";

type Props = {
  lessonId: number;
  courseId: number;
  onClose: () => void;
};

const STATUS_OPTIONS = [
  { value: "PRESENT", label: "Obecny" },
  { value: "ABSENT", label: "Nieobecny" },
  { value: "EXCUSED", label: "Usprawiedliwiony" },
  { value: "LATE", label: "Spóźniony" },
];

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function XMarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
    </svg>
  );
}

function ShieldCheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

const getStatusIcon = (status: string, className: string) => {
  switch (status) {
    case "PRESENT":
      return <CheckIcon className={className} />;
    case "ABSENT":
      return <XMarkIcon className={className} />;
    case "EXCUSED":
      return <ShieldCheckIcon className={className} />;
    case "LATE":
      return <ClockIcon className={className} />;
    default:
      return null;
  }
};

export default function AttendanceModal({ lessonId, courseId, onClose }: Props) {
  const [students, setStudents] = useState<Child[]>([]);
  const [attendances, setAttendances] = useState<Record<number, Attendance>>({});
  const [courseInfo, setCourseInfo] = useState<{ name: string; course_code: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const token = getAccessToken();
      if (!token) return;

      try {
        const [courseRes, attendancesRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/courses/${courseId}/`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/attendances/?lesson=${lessonId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!courseRes.ok) throw new Error("Nie udało się pobrać szczegółów kursu");
        if (!attendancesRes.ok) throw new Error("Nie udało się pobrać obecności");

        const courseData = await courseRes.json();
        const attendancesData = await attendancesRes.json();

        setCourseInfo({ name: courseData.name, course_code: courseData.course_code });

        if (courseData.students) {
          setStudents(courseData.students);
        } else {
          setStudents([]);
        }

        const attMap: Record<number, Attendance> = {};
        attendancesData.forEach((att: Attendance) => {
          attMap[att.student] = att;
        });
        setAttendances(attMap);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Wystąpił nieznany błąd");
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [lessonId, courseId]);

  const handleStatusChange = async (studentId: number, status: string) => {
    const token = getAccessToken();
    if (!token) return;

    const existingAttendance = attendances[studentId];
    const method = existingAttendance ? "PUT" : "POST";
    const url = existingAttendance
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/attendances/${existingAttendance.id}/`
      : `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/attendances/`;

    const body = {
      lesson: lessonId,
      student: studentId,
      status: status,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Nie udało się zapisać obecności");

      const savedAttendance = await res.json();
      setAttendances((prev) => ({
        ...prev,
        [studentId]: savedAttendance,
      }));
    } catch (err: unknown) {
      if (err instanceof Error) {
        alert(err.message);
      } else {
        alert("Wystąpił nieznany błąd");
      }
    }
  };

  const getButtonClass = (statusValue: string, currentStatus: string) => {
    const isSelected = statusValue === currentStatus;
    const baseClass =
      "flex items-center justify-center w-10 h-10 border rounded transition-colors cursor-pointer";

    if (!isSelected) {
      return `${baseClass} bg-white border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 hover:border-gray-300`;
    }

    switch (statusValue) {
      case "PRESENT":
        return `${baseClass} bg-green-500 border-black text-white`;
      case "ABSENT":
        return `${baseClass} bg-red-500 border-black text-white`;
      case "EXCUSED":
        return `${baseClass} bg-yellow-500 border-black text-white`;
      case "LATE":
        return `${baseClass} bg-orange-500 border-black text-white`;
      default:
        return baseClass;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white border border-black rounded-md w-full max-w-2xl max-h-[90vh] flex flex-col shadow-lg">
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold">Oznacz obecność</h2>
            {courseInfo && (
              <p className="text-sm text-gray-500 mt-1">
                {courseInfo.name} ({courseInfo.course_code})
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn h-8 w-8 flex items-center justify-center bg-white p-0"
          >
            ✕
          </button>
        </div>

        <div className="p-4 overflow-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center p-8 text-gray-600">Ładowanie...</div>
          ) : error ? (
            <div className="text-red-500 p-4 border border-red-200 bg-red-50 rounded">{error}</div>
          ) : (
            <div>
              {students.length === 0 ? (
                <p className="text-gray-500">Brak uczniów w tym kursie.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-4 mb-6 p-3 bg-gray-50 border rounded text-sm text-gray-700">
                    <div className="flex items-center gap-1.5">
                      <CheckIcon className="w-4 h-4 text-green-500" /> Obecny
                    </div>
                    <div className="flex items-center gap-1.5">
                      <XMarkIcon className="w-4 h-4 text-red-500" /> Nieobecny
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheckIcon className="w-4 h-4 text-yellow-500" /> Usprawiedliwiony
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ClockIcon className="w-4 h-4 text-orange-500" /> Spóźniony
                    </div>
                  </div>

                  <div className="border rounded overflow-hidden">
                    <table className="w-full text-left border-collapse bg-white">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="py-3 px-4 font-semibold text-sm">Uczeń</th>
                          <th className="py-3 px-4 font-semibold text-sm w-[220px]">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {students.map((student) => {
                          const currentStatus = attendances[student.id]?.status || "";
                          return (
                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4">
                                {student.first_name} {student.last_name}
                              </td>
                              <td className="py-3 px-4">
                                <div className="flex gap-2">
                                  {STATUS_OPTIONS.map((opt) => (
                                    <button
                                      key={opt.value}
                                      onClick={() => handleStatusChange(student.id, opt.value)}
                                      className={getButtonClass(opt.value, currentStatus)}
                                      title={opt.label}
                                    >
                                      {getStatusIcon(opt.value, "w-5 h-5")}
                                    </button>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

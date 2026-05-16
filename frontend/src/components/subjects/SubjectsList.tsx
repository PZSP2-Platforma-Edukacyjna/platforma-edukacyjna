type CourseListItem = {
  id: number;
  course_code: string;
  name: string;
  description: string;
  teacher: number;
};

type Teacher = {
  id: number;
  first_name: string;
  last_name: string;
};

type SubjectsListProps = {
  courses: CourseListItem[];
  teachers: Teacher[];
  onCourseClick: (course: CourseListItem) => void | Promise<void>;
};

export default function SubjectsList({
  courses,
  teachers,
  onCourseClick,
}: SubjectsListProps) {
  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown";
  };

  return (
    <div className="card h-full overflow-auto">
      <h2 className="text-xl font-bold mb-4">Przedmioty</h2>

      <ul className="space-y-2">
        {courses.map((course) => (
          <li
            key={course.id}
            onClick={() => onCourseClick(course)}
            className="p-3 border rounded cursor-pointer hover:bg-gray-100"
          >
            <div className="font-semibold">{course.name}</div>
            <div className="text-sm text-gray-600">{course.course_code}</div>
            <div className="text-sm text-gray-500">
              {getTeacherName(course.teacher)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
type Course = {
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
  courses: Course[];
  teachers: Teacher[];
  onCourseClick: (course: Course) => void;
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
    <div className="card h-full overflow-y-auto bg-white">
      {courses.map((course) => (
        <div
          key={course.id}
          className="card mb-3 h-20 flex flex-col justify-center cursor-pointer hover:bg-gray-100"
          onClick={() => onCourseClick(course)}
        >
          <div className="font-semibold">{course.name}</div>
          <div className="text-xs text-gray-500">
            {getTeacherName(course.teacher)}
          </div>
        </div>
      ))}
    </div>
  );
}

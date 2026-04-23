type LearningMaterial = {
  id: number;
  title: string;
  description: string;
  url: string;
};

type Course = {
  id: number;
  course_code: string;
  name: string;
  description: string;
  teacher: number;
  learning_materials: LearningMaterial[];
};

type Teacher = {
    id: number;
    first_name: string;
    last_name: string;
}

type CourseDetailsProps = {
  course: Course;
  teachers: Teacher[];
  onClose: () => void;
};

export default function CourseDetails({ course, teachers, onClose }: CourseDetailsProps) {
  const getTeacherName = (teacherId: number) => {
    const teacher = teachers.find((t) => t.id === teacherId);
    return teacher ? `${teacher.first_name} ${teacher.last_name}` : "Unknown";
  };

  return (
    <div
      className="fixed inset-0 bg-black/[.3] backdrop-blur-lg overflow-y-auto h-full w-full flex items-center justify-center"
      onClick={onClose}
    >
      <div
        className="relative p-8 border w-3/4 shadow-lg rounded-md bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-0 right-3 mt-4 mr-4 text-2xl font-bold text-gray-700 hover:text-gray-900"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold mb-4">{course.name}</h2>
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Kod kursu:</span> {course.course_code}
        </p>
        <p className="text-gray-700 mb-2">
          <span className="font-semibold">Nauczyciel:</span> {getTeacherName(course.teacher)}
        </p>
        <p className="text-gray-700 mb-4">{course.description}</p>
        <div>
          <h3 className="text-xl font-semibold mb-2">Materiały</h3>
          <ul>
            {course.learning_materials.map((material) => (
              <li key={material.id} className="mb-2 p-2 border-b">
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  {material.title}
                </a>
                <p className="text-gray-600">{material.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export type Child = {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth?: string;
  enrolled_courses: number[];
};

export type Teacher = {
  id: number;
  first_name: string;
  last_name: string;
  email?: string;
};

export type Lesson = {
  id: number;
  course: number;
  course_name: string;
  topic: string;
  date: string;
  teacher: number;
};

export type Attendance = {
  id: number;
  lesson: number;
  student: number;
  status: "PRESENT" | "ABSENT" | "EXCUSED" | "LATE";
  date_marked: string;
};

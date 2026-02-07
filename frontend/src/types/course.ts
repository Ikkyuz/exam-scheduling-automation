export interface Course {
  id: number;
  code: string;
  name: string;
  duration: number;
  examType: string;
}

export type CourseFormInputs = Omit<Course, 'id'>;

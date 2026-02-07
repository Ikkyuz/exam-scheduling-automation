import type { Class } from './class';
import type { Course } from './course';

export interface Enrollment {
    id: number;
    class_id: number;
    course_id: number;
    createdAt: string;
    updatedAt: string;
    class?: Class;
    course?: Course;
}

export type EnrollmentFormInputs = Omit<Enrollment, 'id' | 'createdAt' | 'updatedAt' | 'class' | 'course'>;

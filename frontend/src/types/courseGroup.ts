import type { Course } from './course';

export interface CourseGroup {
    id: number;
    course_id: number;
    groupNum: number;
    createdAt: string;
    updatedAt: string;
    course?: Course;
}

export type CourseGroupFormInputs = {
    course_ids: number[];
    groupNum?: number;
};

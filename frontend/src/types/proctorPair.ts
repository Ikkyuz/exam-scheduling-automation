import type { Teacher } from './teacher';

export interface ProctorPair {
    id: number;
    teacher_id: number;
    groupNum?: number;
    createdAt: string;
    updatedAt: string;
    teacher?: Teacher;
}

export type ProctorPairFormInputs = Omit<ProctorPair, 'id' | 'createdAt' | 'updatedAt' | 'teacher'>;
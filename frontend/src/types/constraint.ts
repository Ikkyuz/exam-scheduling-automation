export interface Constraint {
    id: number;
    category: string;
    level: string;
    constraint: string;
    createdAt: string;
    updatedAt: string;
}

export type ConstraintFormInputs = Omit<Constraint, 'id' | 'createdAt' | 'updatedAt'>;

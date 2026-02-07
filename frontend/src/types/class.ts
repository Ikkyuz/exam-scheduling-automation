export interface Class {
    id: number;
    name: string;
    level: string;
    classYear: string;
    department_id: number;
    department?: Department;
    amount: number;
}

export interface Department {
    id: number;
    name: string;
}

export type ClassFormInputs = Omit<Class, 'id'>;

export interface Department {
    id: number;
    name: string;
}

export type DepartmentFormInputs = Omit<Department, 'id'>;

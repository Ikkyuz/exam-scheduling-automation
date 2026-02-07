export interface Teacher {
    id: number;
    firstname: string;
    lastname: string;
    department_id: number;
    tel: string;
    createdAt: string;
    updatedAt: string;
}

export interface InstructorFormInputs {
    firstname: string;
    lastname: string;
    department_id: number;
    tel: string;
}

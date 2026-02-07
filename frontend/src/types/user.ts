export type Role = 'ADMIN' | 'USER';

export interface User {
    id: number;
    username: string;
    firstname?: string;
    lastname?: string;
    email?: string;
    password?: string;
    role: Role;
    departmentName?: string | null;
}

export type UserFormInputs = Omit<User, 'id'> & { password?: string };

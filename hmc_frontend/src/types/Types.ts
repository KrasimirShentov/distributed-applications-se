// src/types/Types.ts

export enum GenderType {
    Male = 'Male',
    Female = 'Female',
    Other = 'Other',
}

export interface Address {
    addressName: string;
}

export interface User {
    id: string;
    name: string;
    surname: string;
    userName: string;
    email: string;
    gender: GenderType;
    dateOfBirth: string;
    createdOn: string;
    addresses?: Address[];
}

export interface Training {
    id: string;
    type: string;
    positionName: string;
    description: string;
    trainingHours: number;
}

export interface TrainingRequest {
    type: string;
    positionName: string;
    description: string;
    trainingHours: number;
}

export interface Company {
    id: string;
    name: string;
    description: string;
    email: string;
    phoneNumber: string;
    addresses?: Address[];
    departments?: Department[];
}

export interface DepartmentDetails {
    id: string;
    name: string;
    email?: string;
    type?: string;
    phoneNumber?: string;
    description?: string;
}

export interface Department {
    id: string;
    name: string;
    description?: string;
    email?: string;
    phoneNumber?: string;
    type?: string;
    companyId: string;
    companyName?: string;
    companyDescription?: string;
    addresses?: Address[];
    employees?: Employee[];
}

export interface DepartmentRequest {
    name: string;
    description?: string;
    email?: string;
    phoneNumber?: string;
    type?: string;
    companyId: string;
    addresses?: Address[];
    employees?: Employee[];
    DepartmentAddresses?: Address[]; // ADD THIS LINE

}

export interface Department extends DepartmentRequest {
    id: string;
    companyName?: string;
    companyDescription?: string;
}

export interface Employee {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    email: string;
    position: string;
    gender: GenderType;
    departmentId: string;
    departmentDetails?: {
        id: string;
        name: string;
        email: string;
        type: string;
        phoneNumber: string;
        description: string;
    };
    trainingDetails?: Training | null;
}

export interface EmployeeRequest {
    name: string;
    surname: string;
    age: number;
    email: string;
    position: string;
    gender: GenderType;
    departmentId: string;
    trainingId?: string; // Make it optional if the backend allows null
    
}

// src/services/companyService.ts
import api from './api';
import { Company } from '../Types/Company';

export const getAllCompanies = async (): Promise<Company[]> => {
  const response = await api.get<Company[]>('/Company');
  return response.data;
};

export const getCompanyById = async (id: string): Promise<Company> => {
  const response = await api.get<Company>(`/Company/${id}`);
  return response.data;
};

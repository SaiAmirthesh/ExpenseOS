import { apiClient } from './apiClient';

export type PersonalExpenseCategory = 
  | 'FOOD'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'ENTERTAINMENT'
  | 'HEALTH'
  | 'EDUCATION'
  | 'BILLS'
  | 'TRAVEL'
  | 'OTHER';

export interface CreatePersonalExpenseRequest {
  title: string;
  description?: string;
  amount: number;
  category: PersonalExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
}

export interface PersonalExpenseResponse {
  id: number;
  title: string;
  amount: number;
  category: PersonalExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
}

export const personalExpenseService = {
  createExpense: async (data: CreatePersonalExpenseRequest): Promise<PersonalExpenseResponse> => {
    const response = await apiClient.post<PersonalExpenseResponse>('/personal-expenses', data);
    return response.data;
  },

  getAllExpenses: async (): Promise<PersonalExpenseResponse[]> => {
    const response = await apiClient.get<PersonalExpenseResponse[]>('/personal-expenses');
    return response.data;
  },

  getExpense: async (id: number): Promise<PersonalExpenseResponse> => {
    const response = await apiClient.get<PersonalExpenseResponse>(`/personal-expenses/${id}`);
    return response.data;
  },

  updateExpense: async (id: number, data: CreatePersonalExpenseRequest): Promise<PersonalExpenseResponse> => {
    const response = await apiClient.put<PersonalExpenseResponse>(`/personal-expenses/${id}`, data);
    return response.data;
  },

  deleteExpense: async (id: number): Promise<void> => {
    await apiClient.delete(`/personal-expenses/${id}`);
  },

  getByCategory: async (category: PersonalExpenseCategory): Promise<PersonalExpenseResponse[]> => {
    const response = await apiClient.get<PersonalExpenseResponse[]>(`/personal-expenses/category/${category}`);
    return response.data;
  },

  getByDateRange: async (startDate: string, endDate: string): Promise<PersonalExpenseResponse[]> => {
    const response = await apiClient.get<PersonalExpenseResponse[]>('/personal-expenses/date-range', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};

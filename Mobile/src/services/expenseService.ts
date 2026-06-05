import { apiClient } from './apiClient';
import { ExpenseCategoryType, SplitTypeType } from '../features/expenses/schemas/expenseSchemas';

export interface ExpenseSplitResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  amount: number;
  settled: boolean;
}

export interface ExpenseResponse {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategoryType;
  splitType: SplitTypeType;
  groupId: number;
  groupName: string;
  paidById: number;
  paidByName: string;
  paidByEmail: string;
  createdAt: string;
  updatedAt: string;
  splits: ExpenseSplitResponse[];
}

export interface CreateExpenseRequest {
  groupId: number;
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategoryType;
  splitType: SplitTypeType;
  splits?: {
    userId: number;
    amount?: number;
    percentage?: number;
  }[];
}

export const expenseService = {
  createExpense: async (data: CreateExpenseRequest): Promise<ExpenseResponse> => {
    const response = await apiClient.post<ExpenseResponse>('/expenses', data);
    return response.data;
  },

  getExpensesByGroup: async (groupId: number): Promise<ExpenseResponse[]> => {
    const response = await apiClient.get<ExpenseResponse[]>(`/groups/${groupId}/expenses`);
    return response.data;
  },
};

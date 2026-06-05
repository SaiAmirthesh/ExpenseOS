import { apiClient } from './apiClient';

export interface BalanceResponse {
  userId: number;
  name: string;
  balance: number;
}

export interface SettlementSuggestion {
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
}

export const balanceService = {
  getBalances: async (groupId: number): Promise<BalanceResponse[]> => {
    const response = await apiClient.get<BalanceResponse[]>(`/groups/${groupId}/balances`);
    return response.data;
  },

  getSettlementSuggestions: async (groupId: number): Promise<SettlementSuggestion[]> => {
    const response = await apiClient.get<SettlementSuggestion[]>(`/groups/${groupId}/settlement-suggestions`);
    return response.data;
  },
};

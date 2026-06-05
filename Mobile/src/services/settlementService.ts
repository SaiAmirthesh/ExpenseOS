import { apiClient } from './apiClient';

export type SettlementStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SettlementRequest {
  groupId: number;
  toUserId: number;
  amount: number;
  note?: string;
}

export interface SettlementResponse {
  id: number;
  groupId: number;
  groupName: string;
  fromUserId: number;
  fromUserName: string;
  toUserId: number;
  toUserName: string;
  amount: number;
  note?: string;
  status: SettlementStatus;
  createdAt: string;
  settledAt?: string;
  approvedAt?: string;
}

export const settlementService = {
  createSettlement: async (data: SettlementRequest): Promise<SettlementResponse> => {
    const response = await apiClient.post<SettlementResponse>('/settlements', data);
    return response.data;
  },

  getPendingSettlements: async (): Promise<SettlementResponse[]> => {
    const response = await apiClient.get<SettlementResponse[]>('/settlements/pending');
    return response.data;
  },

  approveSettlement: async (id: number): Promise<SettlementResponse> => {
    const response = await apiClient.post<SettlementResponse>(`/settlements/${id}/approve`);
    return response.data;
  },

  rejectSettlement: async (id: number): Promise<SettlementResponse> => {
    const response = await apiClient.post<SettlementResponse>(`/settlements/${id}/reject`);
    return response.data;
  },

  getSettlementsByGroup: async (groupId: number): Promise<SettlementResponse[]> => {
    const response = await apiClient.get<SettlementResponse[]>(`/groups/${groupId}/settlements`);
    return response.data;
  },
};

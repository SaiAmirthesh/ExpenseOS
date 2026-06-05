import { apiClient } from './apiClient';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';

export interface InviteUserRequest {
  email: string;
}

export interface InvitationResponse {
  id: number;
  groupId: number;
  groupName: string;
  invitedBy: string;
  invitedUser: string;
  status: InvitationStatus;
}

export const invitationService = {
  inviteUser: async (groupId: number, data: InviteUserRequest): Promise<InvitationResponse> => {
    const response = await apiClient.post<InvitationResponse>(`/groups/${groupId}/invite`, data);
    return response.data;
  },

  getInvitations: async (): Promise<InvitationResponse[]> => {
    const response = await apiClient.get<InvitationResponse[]>('/invitations');
    return response.data;
  },

  getPendingInvitations: async (): Promise<InvitationResponse[]> => {
    const response = await apiClient.get<InvitationResponse[]>('/invitations/pending');
    return response.data;
  },

  acceptInvitation: async (id: number): Promise<InvitationResponse> => {
    const response = await apiClient.post<InvitationResponse>(`/invitations/${id}/accept`);
    return response.data;
  },

  rejectInvitation: async (id: number): Promise<InvitationResponse> => {
    const response = await apiClient.post<InvitationResponse>(`/invitations/${id}/reject`);
    return response.data;
  },
};

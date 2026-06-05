import { apiClient } from './apiClient';

export interface GroupResponse {
  id: number;
  name: string;
  description?: string;
  createdBy: string;
}

export interface CreateGroupRequest {
  name: string;
  description?: string;
}

export interface AddMemberRequest {
  email: string;
}

export interface MemberResponse {
  id: number;
  name: string;
  email: string;
}

export const groupService = {
  createGroup: async (data: CreateGroupRequest): Promise<GroupResponse> => {
    const response = await apiClient.post<GroupResponse>('/groups', data);
    return response.data;
  },

  listGroups: async (): Promise<GroupResponse[]> => {
    const response = await apiClient.get<GroupResponse[]>('/groups');
    return response.data;
  },

  getGroupById: async (groupId: number): Promise<GroupResponse> => {
    const response = await apiClient.get<GroupResponse>(`/groups/${groupId}`);
    return response.data;
  },

  deleteGroup: async (groupId: number): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}`);
  },

  addMember: async (groupId: number, data: AddMemberRequest): Promise<MemberResponse> => {
    const response = await apiClient.post<MemberResponse>(`/groups/${groupId}/members`, data);
    return response.data;
  },

  getMembers: async (groupId: number): Promise<MemberResponse[]> => {
    const response = await apiClient.get<MemberResponse[]>(`/groups/${groupId}/members`);
    return response.data;
  },

  removeMember: async (groupId: number, userId: number): Promise<void> => {
    await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  },
};

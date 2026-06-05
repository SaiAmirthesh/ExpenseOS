import { apiClient } from './apiClient';

export interface UserResponse {
  id: number;
  name: string;
  email: string;
}

export const userService = {
  getCurrentUser: async (): Promise<UserResponse> => {
    const response = await apiClient.get<UserResponse>('/users/me');
    return response.data;
  },
};

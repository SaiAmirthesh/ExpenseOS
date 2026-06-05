import { apiClient } from './apiClient';
import { LoginFields, RegisterFields } from '../features/auth/schemas/authSchema';

export interface AuthResponseData {
  accessToken: string;
  refreshToken: string;
  email: string;
  name: string;
}

export const authService = {
  login: async (data: LoginFields): Promise<AuthResponseData> => {
    const response = await apiClient.post<AuthResponseData>('/auth/login', {
      email: data.email,
      password: data.password,
    });
    return response.data;
  },

  register: async (data: RegisterFields): Promise<string> => {
    const response = await apiClient.post<string>('/auth/register', {
      name: data.name,
      email: data.email,
      password: data.password,
    });
    return response.data;
  },
};

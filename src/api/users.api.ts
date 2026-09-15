import { apiClient } from './client';
import { UserDTO, UpdateUserPayload, PaginatedUsersResponse } from '../types/user.types';

export const usersApi = {
  async getMe(): Promise<UserDTO> {
    return apiClient<UserDTO>('/users/me');
  },

  async updateMe(payload: UpdateUserPayload): Promise<UserDTO> {
    return apiClient<UserDTO>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async listUsers(page = 1, limit = 20): Promise<PaginatedUsersResponse> {
    return apiClient<PaginatedUsersResponse>(`/users?page=${page}&limit=${limit}`);
  },

  async getUser(id: string): Promise<UserDTO> {
    return apiClient<UserDTO>(`/users/${id}`);
  },

  async updateUser(id: string, payload: UpdateUserPayload): Promise<UserDTO> {
    return apiClient<UserDTO>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteUser(id: string): Promise<void> {
    return apiClient<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};


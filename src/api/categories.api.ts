import { apiClient } from './client';
import {
  CategoryDTO,
  CreateCategoryPayload,
  UpdateCategoryPayload,
} from '../types/category.types';

export const categoriesApi = {
  async listCategories(): Promise<CategoryDTO[]> {
    return apiClient<CategoryDTO[]>('/categories');
  },

  async getCategory(id: string): Promise<CategoryDTO> {
    return apiClient<CategoryDTO>(`/categories/${id}`);
  },

  async createCategory(payload: CreateCategoryPayload): Promise<CategoryDTO> {
    return apiClient<CategoryDTO>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCategory(id: string, payload: UpdateCategoryPayload): Promise<CategoryDTO> {
    return apiClient<CategoryDTO>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteCategory(id: string): Promise<void> {
    return apiClient<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};


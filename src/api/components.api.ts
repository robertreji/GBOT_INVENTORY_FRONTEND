import { apiClient } from './client';
import {
  ComponentDTO,
  ComponentInstanceDTO,
  QuantityInventoryDTO,
  CreateComponentPayload,
  UpdateComponentPayload,
  CreateInstancePayload,
  UpdateInstancePayload,
  UpdateInventoryPayload,
  PaginatedComponentsResponse,
} from '../types/component.types';

export interface ComponentFilterParams {
  page?: number;
  limit?: number;
  categoryId?: string;
  inventoryType?: 'sticker_based' | 'quantity_based';
  search?: string;
}

export const componentsApi = {
  async listComponents(params: ComponentFilterParams = {}): Promise<PaginatedComponentsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.inventoryType) query.set('inventoryType', params.inventoryType);
    if (params.search) query.set('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient<PaginatedComponentsResponse>(`/components${queryString}`);
  },

  async getComponent(id: string): Promise<ComponentDTO> {
    return apiClient<ComponentDTO>(`/components/${id}`);
  },

  async createComponent(payload: CreateComponentPayload): Promise<ComponentDTO> {
    return apiClient<ComponentDTO>('/components', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateComponent(id: string, payload: UpdateComponentPayload): Promise<ComponentDTO> {
    return apiClient<ComponentDTO>(`/components/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteComponent(id: string): Promise<void> {
    return apiClient<void>(`/components/${id}`, {
      method: 'DELETE',
    });
  },

  // Instances (Sticker-based)
  async listInstances(componentId: string): Promise<ComponentInstanceDTO[]> {
    return apiClient<ComponentInstanceDTO[]>(`/components/${componentId}/instances`);
  },

  async createInstance(componentId: string, payload: CreateInstancePayload): Promise<ComponentInstanceDTO> {
    return apiClient<ComponentInstanceDTO>(`/components/${componentId}/instances`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateInstance(
    componentId: string,
    instanceId: string,
    payload: UpdateInstancePayload
  ): Promise<ComponentInstanceDTO> {
    return apiClient<ComponentInstanceDTO>(`/components/${componentId}/instances/${instanceId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteInstance(componentId: string, instanceId: string): Promise<void> {
    return apiClient<void>(`/components/${componentId}/instances/${instanceId}`, {
      method: 'DELETE',
    });
  },

  // Inventory (Quantity-based)
  async getInventory(componentId: string): Promise<QuantityInventoryDTO> {
    return apiClient<QuantityInventoryDTO>(`/components/${componentId}/inventory`);
  },

  async updateInventory(componentId: string, payload: UpdateInventoryPayload): Promise<QuantityInventoryDTO> {
    return apiClient<QuantityInventoryDTO>(`/components/${componentId}/inventory`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};


import { apiClient } from './client';
import {
  RenewalDTO,
  CreateRenewalPayload,
  UpdateRenewalPayload,
} from '../types/renewal.types';

export const renewalsApi = {
  async createRenewal(payload: CreateRenewalPayload): Promise<RenewalDTO> {
    return apiClient<RenewalDTO>('/renewals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listRenewalsForBorrow(borrowId: string): Promise<RenewalDTO[]> {
    return apiClient<RenewalDTO[]>(`/renewals/borrow/${borrowId}`);
  },

  async updateRenewal(id: string, payload: UpdateRenewalPayload): Promise<RenewalDTO> {
    return apiClient<RenewalDTO>(`/renewals/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },
};


import { apiClient } from './client';
import {
  BorrowDTO,
  BorrowWithItemsDTO,
  ReturnItemDTO,
  CreateBorrowPayload,
  UpdateBorrowStatusPayload,
  CreateReturnPayload,
  PaginatedBorrowsResponse,
  BorrowStatus,
} from '../types/borrow.types';

export interface BorrowFilterParams {
  page?: number;
  limit?: number;
  status?: BorrowStatus;
}

export const borrowsApi = {
  async listBorrows(params: BorrowFilterParams = {}): Promise<PaginatedBorrowsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient<PaginatedBorrowsResponse>(`/borrows${queryString}`);
  },

  async getBorrow(id: string): Promise<BorrowWithItemsDTO> {
    return apiClient<BorrowWithItemsDTO>(`/borrows/${id}`);
  },

  async createBorrow(payload: CreateBorrowPayload): Promise<BorrowWithItemsDTO> {
    return apiClient<BorrowWithItemsDTO>('/borrows', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateBorrowStatus(id: string, payload: UpdateBorrowStatusPayload): Promise<BorrowDTO> {
    return apiClient<BorrowDTO>(`/borrows/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async listReturns(borrowId: string): Promise<ReturnItemDTO[]> {
    return apiClient<ReturnItemDTO[]>(`/borrows/${borrowId}/returns`);
  },

  async createReturn(borrowId: string, payload: CreateReturnPayload): Promise<ReturnItemDTO> {
    return apiClient<ReturnItemDTO>(`/borrows/${borrowId}/returns`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};


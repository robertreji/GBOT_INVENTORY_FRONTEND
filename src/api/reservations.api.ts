import { apiClient } from './client';
import {
  ReservationDTO,
  ReservationWithItemsDTO,
  CreateReservationPayload,
  UpdateReservationStatusPayload,
  PaginatedReservationsResponse,
  ReservationStatus,
} from '../types/reservation.types';

export interface ReservationFilterParams {
  page?: number;
  limit?: number;
  status?: ReservationStatus;
}

export const reservationsApi = {
  async createReservation(payload: CreateReservationPayload): Promise<ReservationWithItemsDTO> {
    return apiClient<ReservationWithItemsDTO>('/reservations', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async listReservations(params: ReservationFilterParams = {}): Promise<PaginatedReservationsResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.status) query.set('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    return apiClient<PaginatedReservationsResponse>(`/reservations${queryString}`);
  },

  async getReservation(id: string): Promise<ReservationWithItemsDTO> {
    return apiClient<ReservationWithItemsDTO>(`/reservations/${id}`);
  },

  async cancelReservation(id: string): Promise<ReservationDTO> {
    return apiClient<ReservationDTO>(`/reservations/${id}/cancel`, {
      method: 'PATCH',
    });
  },

  async updateReservationStatus(
    id: string,
    payload: UpdateReservationStatusPayload
  ): Promise<ReservationDTO> {
    return apiClient<ReservationDTO>(`/reservations/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteReservation(id: string): Promise<void> {
    return apiClient<void>(`/reservations/${id}`, {
      method: 'DELETE',
    });
  },
};


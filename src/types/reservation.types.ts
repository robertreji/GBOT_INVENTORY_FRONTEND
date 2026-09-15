import { PaginationMeta } from './api.types';
import { ComponentDTO } from './component.types';

export type ReservationStatus =
  | 'pending'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'expired'
  | 'cancelled';

export interface ReservationDTO {
  id: string;
  userId: string;
  reservationDate: string;
  expiresAt: string | null;
  reservationStatus: ReservationStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    name: string;
    email: string;
    department?: string | null;
  };
}

export interface ReservationItemDTO {
  id: string;
  reservationId: string;
  componentId: string;
  quantity: number;
  component?: ComponentDTO;
}

export interface ReservationWithItemsDTO extends ReservationDTO {
  items: ReservationItemDTO[];
}

export interface CreateReservationItemPayload {
  componentId: string;
  quantity: number;
}

export interface CreateReservationPayload {
  items: CreateReservationItemPayload[];
  expiresAt?: string | null;
}

export interface UpdateReservationStatusPayload {
  reservationStatus: ReservationStatus;
}

export interface PaginatedReservationsResponse {
  reservations: ReservationWithItemsDTO[] | ReservationDTO[];
  pagination: PaginationMeta;
}


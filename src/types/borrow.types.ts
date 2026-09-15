import { PaginationMeta } from './api.types';
import { ComponentDTO, ComponentInstanceDTO } from './component.types';
import { UserDTO } from './user.types';

export type BorrowStatus = 'active' | 'partially_returned' | 'overdue' | 'fully_returned';
export type ReturnType = 'returned' | 'lost' | 'damaged';

export interface BorrowDTO {
  id: string;
  userId: string;
  reservationId: string | null;
  borrowDate: string;
  dueDate: string;
  borrowApprovedByAdminId: string | null;
  borrowStatus: BorrowStatus;
  createdAt: string;
  updatedAt: string;
  user?: UserDTO;
}

export interface BorrowItemDTO {
  id: string;
  borrowId: string;
  componentId: string;
  componentInstanceId: string | null;
  quantity: number;
  component?: ComponentDTO;
  instance?: ComponentInstanceDTO;
  returnedQuantity?: number;
}

export interface BorrowWithItemsDTO extends BorrowDTO {
  items: BorrowItemDTO[];
}

export interface ReturnItemDTO {
  id: string;
  borrowItemId: string;
  returnDate: string;
  approvedByAdminId: string | null;
  returnType: ReturnType;
  quantity: number;
  createdAt: string;
}

export interface CreateBorrowItemPayload {
  componentId: string;
  componentInstanceId?: string | null;
  quantity: number;
}

export interface CreateBorrowPayload {
  userId: string;
  reservationId?: string | null;
  dueDate: string;
  items: CreateBorrowItemPayload[];
}

export interface UpdateBorrowStatusPayload {
  borrowStatus: BorrowStatus;
}

export interface CreateReturnPayload {
  borrowItemId: string;
  returnType: ReturnType;
  quantity: number;
}

export interface PaginatedBorrowsResponse {
  borrows: BorrowDTO[] | BorrowWithItemsDTO[];
  pagination: PaginationMeta;
}


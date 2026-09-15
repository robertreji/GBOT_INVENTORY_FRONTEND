import { PaginationMeta } from './api.types';

export interface UserDTO {
  id: string;
  name: string;
  department: string | null;
  year: number | null;
  email: string;
  profileImg: string | null;
  phoneNo: string | null;
  createdAt: string;
  updatedAt: string;
  role?: 'admin' | 'user';
}

export interface UpdateUserPayload {
  name?: string;
  department?: string;
  year?: number;
  phoneNo?: string;
  profileImg?: string | null;
  email?: string; // only for admin PATCH /users/:id
}

export interface PaginatedUsersResponse {
  users: UserDTO[];
  pagination: PaginationMeta;
}


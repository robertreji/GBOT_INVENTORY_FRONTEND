export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedData<T> {
  items?: T[];
  pagination: PaginationMeta;
  [key: string]: unknown;
}

export class ApiError extends Error {
  status: number;
  validationErrors?: Record<string, string>;

  constructor(status: number, message: string, validationErrors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.validationErrors = validationErrors;
  }
}


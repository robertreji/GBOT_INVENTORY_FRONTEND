import { PaginationMeta } from './api.types';
import { CategoryDTO } from './category.types';

export type InventoryType = 'sticker_based' | 'quantity_based';
export type ConditionStatus = 'working' | 'not_working' | 'under_repair';

export interface ComponentDTO {
  id: string;
  name: string;
  categoryId: string;
  description: string | null;
  inventoryType: InventoryType;
  createdAt: string;
  updatedAt: string;
  category?: CategoryDTO;
}

export interface ComponentInstanceDTO {
  id: string;
  componentId: string;
  stickerCode: string;
  conditionStatus: ConditionStatus;
}

export interface QuantityInventoryDTO {
  componentId: string;
  totalQuantity: number;
  reservedQuantity: number;
  borrowedQuantity: number;
  lostCount: number;
  damagedCount: number;
  availableQuantity: number;
}

export interface CreateComponentPayload {
  name: string;
  categoryId: string;
  description?: string | null;
  inventoryType: InventoryType;
  totalQuantity?: number; // Only for quantity_based
}

export interface UpdateComponentPayload {
  name?: string;
  categoryId?: string;
  description?: string | null;
}

export interface CreateInstancePayload {
  stickerCode: string;
  conditionStatus?: ConditionStatus;
}

export interface UpdateInstancePayload {
  conditionStatus: ConditionStatus;
}

export interface UpdateInventoryPayload {
  totalQuantity?: number;
  reservedQuantity?: number;
  borrowedQuantity?: number;
  lostCount?: number;
  damagedCount?: number;
}

export interface PaginatedComponentsResponse {
  components: ComponentDTO[];
  pagination: PaginationMeta;
}


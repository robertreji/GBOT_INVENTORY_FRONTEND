export type RenewalStatus = 'pending' | 'approved' | 'rejected';

export interface RenewalDTO {
  id: string;
  borrowId: string;
  renewalDate: string;
  renewalApprovedByAdminId: string | null;
  renewalStatus: RenewalStatus;
  createdAt: string;
}

export interface CreateRenewalPayload {
  borrowId: string;
}

export interface UpdateRenewalPayload {
  renewalStatus: 'approved' | 'rejected';
  newDueDate?: string; // Required when approving
}


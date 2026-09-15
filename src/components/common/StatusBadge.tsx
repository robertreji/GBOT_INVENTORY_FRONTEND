'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { ReservationStatus } from '../../types/reservation.types';
import { BorrowStatus } from '../../types/borrow.types';
import { RenewalStatus } from '../../types/renewal.types';

export interface StatusBadgeProps {
  status: ReservationStatus | BorrowStatus | RenewalStatus | string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  switch (status) {
    // Reservation Statuses
    case 'pending':
      return <Badge variant="warning" size={size}>Pending</Badge>;
    case 'partially_fulfilled':
      return <Badge variant="info" size={size}>Partially Fulfilled</Badge>;
    case 'fulfilled':
      return <Badge variant="success" size={size}>Fulfilled</Badge>;
    case 'cancelled':
      return <Badge variant="danger" size={size}>Cancelled</Badge>;
    case 'expired':
      return <Badge variant="neutral" size={size}>Expired</Badge>;

    // Borrow Statuses
    case 'active':
      return <Badge variant="success" size={size}>Active</Badge>;
    case 'partially_returned':
      return <Badge variant="info" size={size}>Partially Returned</Badge>;
    case 'overdue':
      return <Badge variant="danger" size={size}>Overdue</Badge>;
    case 'fully_returned':
      return <Badge variant="neutral" size={size}>Fully Returned</Badge>;

    // Renewal Statuses
    case 'approved':
      return <Badge variant="success" size={size}>Approved</Badge>;
    case 'rejected':
      return <Badge variant="danger" size={size}>Rejected</Badge>;

    default:
      return <Badge variant="neutral" size={size}>{status.replace('_', ' ')}</Badge>;
  }
};


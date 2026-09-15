'use client';

import React from 'react';
import { Badge } from '../ui/Badge';
import { ConditionStatus } from '../../types/component.types';

export interface ConditionBadgeProps {
  condition: ConditionStatus;
  size?: 'sm' | 'md';
}

export const ConditionBadge: React.FC<ConditionBadgeProps> = ({ condition, size = 'sm' }) => {
  switch (condition) {
    case 'working':
      return <Badge variant="success" size={size}>Working</Badge>;
    case 'under_repair':
      return <Badge variant="warning" size={size}>Under Repair</Badge>;
    case 'not_working':
      return <Badge variant="danger" size={size}>Not Working / Lost</Badge>;
    default:
      return <Badge variant="neutral" size={size}>{condition}</Badge>;
  }
};


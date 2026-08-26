import React from 'react';
import type { ItemType } from './CreateItemModal';

interface RoleSwitcherBarProps {
  onOpenPrivileges?: () => void;
  onOpenCreateItem?: (type?: ItemType) => void;
}

export const RoleSwitcherBar: React.FC<RoleSwitcherBarProps> = () => null;


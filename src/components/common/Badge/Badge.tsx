import React from 'react';
import './Badge.scss';

export interface BadgeProps {
  type: 'status' | 'type';
  variant: string; // 'completed', 'pending', 'failed', 'topup', 'deduction', etc.
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({
  type,
  variant,
  children,
  className = '',
}) => {
  const badgeClasses = [
    type === 'status' ? 'status-badge' : 'type-badge',
    `${type}-${variant.toLowerCase()}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <span className={badgeClasses}>{children}</span>;
};

export default Badge;

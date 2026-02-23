import React from 'react';
import './StatCard.scss';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info';
  loading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'primary',
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={`stat-card loading ${color}`}>
        <div className="stat-card-shimmer"></div>
      </div>
    );
  }

  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-card-content">
        <div className="stat-card-header">
          <span className="stat-card-title">{title}</span>
          {icon && <div className="stat-card-icon">{icon}</div>}
        </div>
        <div className="stat-card-body">
          <h3 className="stat-card-value">{value}</h3>
          {trend && (
            <div className={`stat-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
              <span className="trend-icon">
                {trend.isPositive ? '↑' : '↓'}
              </span>
              <span className="trend-value">{Math.abs(trend.value)}%</span>
              <span className="trend-label">vs last month</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatCard;

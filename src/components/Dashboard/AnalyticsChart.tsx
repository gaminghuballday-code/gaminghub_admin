import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import './AnalyticsChart.scss';

interface AnalyticsChartProps {
  data: any[];
  loading?: boolean;
  period: 'daily' | 'weekly' | 'monthly';
  onPeriodChange: (period: 'daily' | 'weekly' | 'monthly') => void;
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  loading = false,
  period,
  onPeriodChange,
}) => {
  // Ensure data is always an array before passing to Recharts
  const chartData = Array.isArray(data) ? data : [];

  if (loading) {
    return (
      <div className="analytics-chart-container loading">
        <div className="chart-shimmer"></div>
      </div>
    );
  }

  return (
    <div className="analytics-chart-container">
      <div className="chart-header">
        <h3 className="chart-title">Financial Analytics</h3>
        <div className="period-selector">
          <button
            className={`period-btn ${period === 'daily' ? 'active' : ''}`}
            onClick={() => onPeriodChange('daily')}
          >
            Daily
          </button>
          <button
            className={`period-btn ${period === 'weekly' ? 'active' : ''}`}
            onClick={() => onPeriodChange('weekly')}
          >
            Weekly
          </button>
          <button
            className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
            onClick={() => onPeriodChange('monthly')}
          >
            Monthly
          </button>
        </div>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={350}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis 
              dataKey="date" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748b', fontSize: 12 }}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: 'none',
                borderRadius: '8px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                padding: '12px'
              }}
              formatter={(value: any) => [`₹${value}`, '']}
            />
            <Legend verticalAlign="top" height={36} align="right" />
            <Area
              name="Total Income"
              type="monotone"
              dataKey="income"
              stroke="#4f46e5"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorIncome)"
            />
            <Area
              name="Net Profit"
              type="monotone"
              dataKey="profit"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorProfit)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AnalyticsChart;

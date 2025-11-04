"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';

interface ChartMetric {
  key: string;
  name: string;
  color: string;
  yAxis?: 'left' | 'right';
  formatter?: (value: number) => string;
}

interface FlexibleChartProps {
  data: any[];
  title: string;
  description?: string;
  metrics: ChartMetric[];
  height?: number;
  showRightAxis?: boolean;
}

export function FlexibleChart({
  data,
  title,
  description,
  metrics,
  height = 400,
  showRightAxis = false
}: FlexibleChartProps) {
  // Format data for recharts - convert month format to display format
  const chartData = data.map(item => ({
    ...item,
    displayMonth: new Date(item.month + '-01').toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric'
    })
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {label}
          </p>
          {payload.map((entry: any, index: number) => {
            const metric = metrics.find(m => m.key === entry.dataKey);
            const formatter = metric?.formatter;
            const value = formatter ? formatter(entry.value) : entry.value.toLocaleString();

            return (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: {value}
              </p>
            );
          })}
        </div>
      );
    }
    return null;
  };

  // Custom YAxis tick formatter for left axis
  const formatLeftYAxisTick = (value: number) => {
    const leftMetrics = metrics.filter(m => !m.yAxis || m.yAxis === 'left');

    // Check if any left metric uses currency formatting
    const hasCurrency = leftMetrics.some(m => m.formatter?.name === 'formatCurrency');
    if (hasCurrency) {
      return `$${(value / 1000).toFixed(0)}K`;
    }

    // Use K/M notation for large numbers
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // Custom YAxis tick formatter for right axis
  const formatRightYAxisTick = (value: number) => {
    const rightMetrics = metrics.filter(m => m.yAxis === 'right');

    // Check if any right metric uses currency formatting
    const hasCurrency = rightMetrics.some(m => m.formatter?.name === 'formatCurrency');
    if (hasCurrency) {
      return `$${(value / 1000).toFixed(0)}K`;
    }

    // Use K/M notation for large numbers
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  // // Formatters
  // const formatCurrency = (value: number) => {
  //   return new Intl.NumberFormat('en-US', {
  //     style: 'currency',
  //     currency: 'USD',
  //   }).format(value);
  // };

  // const formatTokens = (value: number) => {
  //   if (value >= 1000000) {
  //     return `${(value / 1000000).toFixed(1)}M`;
  //   } else if (value >= 1000) {
  //     return `${(value / 1000).toFixed(1)}K`;
  //   }
  //   return value.toLocaleString();
  // };

  return (
    <div className="w-full h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="displayMonth"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            yAxisId="left"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={formatLeftYAxisTick}
          />
          {showRightAxis && (
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={{ stroke: '#e5e7eb' }}
              tickFormatter={formatRightYAxisTick}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{
              paddingTop: '20px'
            }}
          />

          {metrics.map((metric) => (
            <Bar
              key={metric.key}
              yAxisId={metric.yAxis || 'left'}
              dataKey={metric.key}
              fill={metric.color}
              name={metric.name}
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
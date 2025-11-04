"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

interface DailyUsageData {
  date: string;
  tokens: number;
}

interface DailyUsageChartProps {
  data: DailyUsageData[];
  selectedMonth: string;
}

export function DailyUsageChart({ data, selectedMonth }: DailyUsageChartProps) {
  // Format data for recharts
  const chartData = data.map(item => {
    const date = new Date(item.date);
    return {
      day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      tokens: item.tokens
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="text-sm font-medium text-gray-900">
            {label}
          </p>
          <p className="text-sm text-blue-600">
            {payload[0].value.toLocaleString()} tokens
          </p>
        </div>
      );
    }
    return null;
  };

  // Format tokens for display
  const formatTokens = (tokens: number) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(1)}K`;
    }
    return tokens.toString();
  };

  // Custom YAxis tick formatter
  const formatYAxisTick = (value: number) => {
    return formatTokens(value);
  };

  // // Get month name for display
  // const getMonthName = () => {
  //   return new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
  //     month: 'long',
  //     year: 'numeric'
  //   });
  // };

  return (
    <div className="w-full mt-4">
      <ResponsiveContainer width="100%" height={400}>
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
            dataKey="day"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            tickLine={{ stroke: '#e5e7eb' }}
            tickFormatter={formatYAxisTick}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="tokens"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            barSize={20}
          />
        </BarChart>
      </ResponsiveContainer>

    </div>
  );
}
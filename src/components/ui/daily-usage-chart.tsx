"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

interface DailyUsageData {
  date: string;
  cachedTokens: number;
  inputTokens: number;
  outputTokens: number;
}

interface DailyUsageChartProps {
  data: DailyUsageData[];
  selectedMonth: string;
}

export function DailyUsageChart({ data, selectedMonth }: DailyUsageChartProps) {
  // Generate all dates for the selected month
  const generateAllDatesForMonth = (monthString: string) => {
    const [year, month] = monthString.split('-').map(Number);
    const dates = [];

    // Get the number of days in the month (month is 1-12, so we use month for correct month)
    const daysInMonth = new Date(year, month, 0).getDate();

    // Generate all dates from 1st to last day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      // Create date at noon to avoid timezone issues
      const date = new Date(year, month - 1, day, 12, 0, 0); // month-1 because JS months are 0-indexed
      const dateString = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD

      dates.push({
        date: dateString,
        day: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        cachedTokens: 0,
        inputTokens: 0,
        outputTokens: 0
      });
    }

    return dates;
  };

  // Create complete month data with all dates
  const completeMonthData = generateAllDatesForMonth(selectedMonth);

  // Merge actual usage data with complete month data
  const chartData = completeMonthData.map(dateData => {
    const usageItem = data.find(item => item.date === dateData.date);

    // Debug logging for date matching
    if (usageItem) {
      console.log(`Found match: generated ${dateData.date} -> usage item ${usageItem.date}`);
    }

    return {
      day: dateData.day,
      cachedTokens: usageItem?.cachedTokens || 0,
      inputTokens: usageItem?.inputTokens || 0,
      outputTokens: usageItem?.outputTokens || 0
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string; payload: any }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      const totalTokens = payload.reduce((sum, item) => sum + item.value, 0);
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg min-w-[200px]">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {label}
          </p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between text-sm">
              <div className="flex items-center">
                <div
                  className="w-3 h-3 rounded-sm mr-2"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-gray-600">
                  {entry.name === 'cachedTokens' ? 'Cached Tokens' :
                   entry.name === 'inputTokens' ? 'Input Tokens' : 'Output Tokens'}:
                </span>
              </div>
              <span className="font-medium text-gray-900 ml-2">
                {entry.value.toLocaleString()}
              </span>
            </div>
          ))}
          <div className="border-t border-gray-200 mt-2 pt-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <span className="text-gray-900">Total:</span>
              <span className="text-gray-900">{totalTokens.toLocaleString()}</span>
            </div>
          </div>
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
          <Legend
            formatter={(value) => {
              switch(value) {
                case 'cachedTokens': return 'Cached Tokens';
                case 'inputTokens': return 'Input Tokens';
                case 'outputTokens': return 'Output Tokens';
                default: return value;
              }
            }}
          />
          <Bar
            dataKey="cachedTokens"
            stackId="tokens"
            fill="#10b981"
            radius={[0, 0, 0, 0]}
            name="cachedTokens"
          />
          <Bar
            dataKey="inputTokens"
            stackId="tokens"
            fill="#3b82f6"
            radius={[0, 0, 0, 0]}
            name="inputTokens"
          />
          <Bar
            dataKey="outputTokens"
            stackId="tokens"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
            name="outputTokens"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
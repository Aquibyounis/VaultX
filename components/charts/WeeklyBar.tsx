'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface WeekDay {
  day: string;
  expense: number;
  income?: number;
  lastWeek?: number;
}

interface WeeklyBarProps {
  data: WeekDay[];
  currency?: string;
  showLastWeek?: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="bg-elevated border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-xs text-muted mb-1">{label}</p>
      {payload.map((entry: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: entry.color }}>
          {entry.name}: {entry.value.toLocaleString()}
        </p>
      ))}
    </div>
  );
}

export default function WeeklyBar({ data, currency = '₹', showLastWeek = false }: WeeklyBarProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Spending</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
            <XAxis
              dataKey="day"
              tick={{ fill: '#888888', fontSize: 11 }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#888888', fontSize: 11 }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={false}
              tickFormatter={(val) => `${currency}${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="expense"
              fill="#ef4444"
              radius={[6, 6, 0, 0]}
              name="This Week"
              maxBarSize={32}
            />
            {showLastWeek && (
              <Bar
                dataKey="lastWeek"
                fill="#ef4444"
                fillOpacity={0.3}
                radius={[6, 6, 0, 0]}
                name="Last Week"
                maxBarSize={32}
              />
            )}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

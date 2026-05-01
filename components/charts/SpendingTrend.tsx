'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DataPoint {
  date: string;
  expense: number;
  income: number;
}

interface SpendingTrendProps {
  data: DataPoint[];
  currency?: string;
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

export default function SpendingTrend({ data, currency = '₹' }: SpendingTrendProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Spending Trend (30 Days)</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#888888', fontSize: 11 }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={{ stroke: '#2a2a2a' }}
            />
            <YAxis
              tick={{ fill: '#888888', fontSize: 11 }}
              axisLine={{ stroke: '#2a2a2a' }}
              tickLine={{ stroke: '#2a2a2a' }}
              tickFormatter={(val) => `${currency}${val}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              name="Expense"
            />
            <Line
              type="monotone"
              dataKey="income"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
              name="Income"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

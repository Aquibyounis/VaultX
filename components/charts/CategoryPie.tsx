'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface CategoryData {
  name: string;
  value: number;
  color: string;
  icon?: string;
}

interface CategoryPieProps {
  data: CategoryData[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const entry = payload[0];
  return (
    <div className="bg-elevated border border-border rounded-xl px-3 py-2 shadow-lg">
      <p className="text-sm font-medium text-foreground">
        {entry.name}: {entry.value.toLocaleString()}
      </p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap gap-3 mt-4 justify-center">
      {payload?.map((entry: { value: string; color: string }, i: number) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-muted">{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function CategoryPie({ data }: CategoryPieProps) {
  if (data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-foreground mb-4">Category Breakdown</h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-muted">No expense data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-foreground mb-4">Category Breakdown</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              dataKey="value"
              nameKey="name"
              paddingAngle={3}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-elevated border border-border rounded-xl px-3 py-2">
      <p className="text-xs text-muted mb-1">{label}</p>
      {payload.map((e: { name: string; value: number; color: string }, i: number) => (
        <p key={i} className="text-sm font-medium" style={{ color: e.color }}>{e.name}: {e.value.toLocaleString()}</p>
      ))}
    </div>
  );
}

export default function StatsPage() {
  const { currency } = useApp();
  const [tab, setTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [daily, setDaily] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [weekly, setWeekly] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [monthly, setMonthly] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const [dRes, wRes, mRes] = await Promise.all([
          fetch('/api/stats/daily'), fetch('/api/stats/weekly'), fetch('/api/stats/monthly'),
        ]);
        if (dRes.ok) setDaily(await dRes.json());
        if (wRes.ok) setWeekly(await wRes.json());
        if (mRes.ok) setMonthly(await mRes.json());
      } catch {}
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="page-enter space-y-6 pb-24 md:pb-8">
      <h1 className="text-xl font-bold text-foreground">Statistics</h1>

      {/* Tabs */}
      <div className="flex bg-surface border border-border rounded-xl overflow-hidden">
        {(['daily', 'weekly', 'monthly'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium transition-all ${tab === t ? 'bg-accent text-black' : 'text-muted hover:text-foreground'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Daily */}
      {tab === 'daily' && daily && (
        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-3">
            <div className="card"><p className="text-xs text-muted">Spent Today</p><p className="text-lg font-bold text-expense">{currency}{daily.totalSpent.toLocaleString()}</p></div>
            <div className="card"><p className="text-xs text-muted">Transactions</p><p className="text-lg font-bold">{daily.transactionCount}</p></div>
            <div className="card"><p className="text-xs text-muted">Biggest</p><p className="text-sm font-bold text-expense truncate">{daily.biggestExpense ? `${currency}${daily.biggestExpense.amount.toLocaleString()}` : '-'}</p><p className="text-xs text-muted truncate">{daily.biggestExpense?.title || ''}</p></div>
          </div>
          <div className="card"><h3 className="text-sm font-semibold mb-4">Hourly Breakdown</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily.hourlyData}><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} /><XAxis dataKey="hour" tick={{ fill: '#888', fontSize: 10 }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} /><YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expense" maxBarSize={20} /><Bar dataKey="income" fill="#22c55e" radius={[4, 4, 0, 0]} name="Income" maxBarSize={20} /></BarChart>
            </ResponsiveContainer></div>
          </div>
        </div>
      )}

      {/* Weekly */}
      {tab === 'weekly' && weekly && (
        <div className="space-y-6">
          <div className="card"><h3 className="text-sm font-semibold mb-4">This Week vs Last Week</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly.weeklyData}><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} /><XAxis dataKey="day" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} /><YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="This Week" maxBarSize={28} /><Bar dataKey="lastWeek" fill="#ef4444" fillOpacity={0.3} radius={[6, 6, 0, 0]} name="Last Week" maxBarSize={28} /></BarChart>
            </ResponsiveContainer></div>
          </div>
          {weekly.topCategories?.length > 0 && (
            <div className="card"><h3 className="text-sm font-semibold mb-3">Top Categories</h3>
              <div className="space-y-3">{weekly.topCategories.map((c: { name: string; icon: string; color: string; total: number }, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>{c.icon}</div>
                  <div className="flex-1"><p className="text-sm font-medium">{c.name}</p></div>
                  <p className="text-sm font-semibold text-expense">{currency}{c.total.toLocaleString()}</p>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      )}

      {/* Monthly */}
      {tab === 'monthly' && monthly && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="card"><p className="text-xs text-muted">Monthly Expense</p><p className="text-lg font-bold text-expense">{currency}{monthly.totalExpense?.toLocaleString()}</p></div>
            <div className="card"><p className="text-xs text-muted">Monthly Income</p><p className="text-lg font-bold text-income">{currency}{monthly.totalIncome?.toLocaleString()}</p></div>
          </div>
          <div className="card"><h3 className="text-sm font-semibold mb-4">Daily Trend</h3>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly.dailyData}><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" /><XAxis dataKey="day" tick={{ fill: '#888', fontSize: 10 }} axisLine={{ stroke: '#2a2a2a' }} /><YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a2a' }} /><Tooltip content={<ChartTooltip />} /><Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} name="Expense" /><Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} name="Income" /></LineChart>
            </ResponsiveContainer></div>
          </div>
          {monthly.monthlyData?.length > 0 && (
            <div className="card"><h3 className="text-sm font-semibold mb-4">6-Month Comparison</h3>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly.monthlyData}><CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} /><XAxis dataKey="month" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} /><YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} /><Tooltip content={<ChartTooltip />} /><Bar dataKey="expense" fill="#ef4444" radius={[6, 6, 0, 0]} name="Expense" maxBarSize={28} /><Bar dataKey="income" fill="#22c55e" radius={[6, 6, 0, 0]} name="Income" maxBarSize={28} /></BarChart>
              </ResponsiveContainer></div>
            </div>
          )}
          {monthly.categoryData?.length > 0 && (
            <div className="card"><h3 className="text-sm font-semibold mb-4">Category Breakdown</h3>
              <div className="h-64"><ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={monthly.categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" nameKey="name" paddingAngle={3} strokeWidth={0}>{monthly.categoryData.map((e: { color: string }, i: number) => (<Cell key={i} fill={e.color} />))}</Pie><Tooltip content={<ChartTooltip />} /><Legend /></PieChart>
              </ResponsiveContainer></div>
            </div>
          )}
          {monthly.biggestExpense && (
            <div className="card"><p className="text-xs text-muted mb-1">Biggest Expense This Month</p><p className="text-lg font-bold text-expense">{currency}{monthly.biggestExpense.amount.toLocaleString()}</p><p className="text-sm text-muted">{monthly.biggestExpense.title}</p></div>
          )}
        </div>
      )}
    </div>
  );
}

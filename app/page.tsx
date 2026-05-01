'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import { Edit2, X, Package } from 'lucide-react';
import SpendingTrend from '@/components/charts/SpendingTrend';
import CategoryPie from '@/components/charts/CategoryPie';
import WeeklyBar from '@/components/charts/WeeklyBar';

interface Invoice {
  id: number;
  title: string;
  amount: number;
  type: string;
  date: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  group_id: number | null;
  note: string;
}

interface DashboardData {
  todaySpend: number;
  weekSpend: number;
  monthSpend: number;
  monthIncome: number;
  totalInvoices: number;
  trendData: { date: string; expense: number; income: number }[];
  categoryData: { name: string; value: number; color: string }[];
  weeklyData: { day: string; expense: number }[];
  recentInvoices: Invoice[];
}

export default function Dashboard() {
  const pathname = usePathname();
  const { isEditor } = useSession();
  const { balance, currency, refreshBalance } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingBalance, setEditingBalance] = useState(false);
  const [newBalance, setNewBalance] = useState('');

  useEffect(() => {
    fetchDashboardData();
    refreshBalance();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const fetchDashboardData = async () => {
    try {
      const now = Date.now();
      const [monthlyRes, weeklyRes, invoicesRes, dailyRes] = await Promise.all([
        fetch(`/api/stats/monthly?_t=${now}`),
        fetch(`/api/stats/weekly?_t=${now}`),
        fetch(`/api/invoices?page=1&_t=${now}`),
        fetch(`/api/stats/daily?_t=${now}`),
      ]);

      const monthly = monthlyRes.ok ? await monthlyRes.json() : {};
      const weekly = weeklyRes.ok ? await weeklyRes.json() : {};
      const invoices = invoicesRes.ok ? await invoicesRes.json() : { invoices: [], pagination: {} };
      const daily = dailyRes.ok ? await dailyRes.json() : {};

      // Build 30-day trend data
      const trendData: { date: string; expense: number; income: number }[] = [];
      if (monthly.dailyData) {
        const now = new Date();
        const currentMonth = now.getMonth();
        monthly.dailyData.slice(0, 30).forEach((d: { day: string; expense: number; income: number }) => {
          trendData.push({
            date: `${currentMonth + 1}/${d.day}`,
            expense: d.expense,
            income: d.income,
          });
        });
      }

      // Calculate week spend from weekly data
      let weekSpend = 0;
      if (weekly.weeklyData) {
        weekSpend = weekly.weeklyData.reduce((sum: number, d: { expense: number }) => sum + d.expense, 0);
      }

      setData({
        todaySpend: daily.totalSpent || 0,
        weekSpend,
        monthSpend: monthly.totalExpense || 0,
        monthIncome: monthly.totalIncome || 0,
        totalInvoices: invoices.pagination?.total || 0,
        trendData,
        categoryData: monthly.categoryData || [],
        weeklyData: weekly.weeklyData || [],
        recentInvoices: (invoices.invoices || []).slice(0, 5),
      });
    } catch (error) {
      console.error('Dashboard data error:', error);
    }
    setLoading(false);
  };

  const handleBalanceUpdate = async () => {
    const val = parseFloat(newBalance);
    if (isNaN(val)) return;
    
    try {
      await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: val }),
      });
      await refreshBalance();
      setEditingBalance(false);
      setNewBalance('');
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter space-y-6 pb-24 md:pb-8">
      {/* Balance Card */}
      <div className="card relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-muted uppercase tracking-wider">Current Balance</p>
            {isEditor && !editingBalance && (
              <button
                onClick={() => { setEditingBalance(true); setNewBalance(balance.toString()); }}
                className="text-muted hover:text-foreground transition-colors text-sm"
              >
                <Edit2 size={16} />
              </button>
            )}
          </div>

          {editingBalance ? (
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center flex-1 bg-elevated border border-border rounded-xl px-3">
                <span className="text-muted mr-1">{currency}</span>
                <input
                  type="number"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="bg-transparent border-none py-2 text-lg font-bold text-foreground w-full focus:outline-none"
                  autoFocus
                />
              </div>
              <button onClick={handleBalanceUpdate} className="btn-primary text-sm !py-2 !px-4">
                Save
              </button>
              <button onClick={() => setEditingBalance(false)} className="btn-ghost text-sm !py-2 !px-3">
                <X size={16} />
              </button>
            </div>
          ) : (
            <p className="text-3xl font-bold text-foreground mt-1">
              {currency} {balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </p>
          )}

          <div className="flex gap-3 mt-4">
            <span className="chip-income">
              +{currency} {(data?.monthIncome || 0).toLocaleString('en-IN')} this month
            </span>
            <span className="chip-expense">
              -{currency} {(data?.monthSpend || 0).toLocaleString('en-IN')} this month
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Today" value={data?.todaySpend || 0} currency={currency} />
        <StatCard label="This Week" value={data?.weekSpend || 0} currency={currency} />
        <StatCard label="This Month" value={data?.monthSpend || 0} currency={currency} />
        <StatCard label="Total Invoices" value={data?.totalInvoices || 0} isCount />
      </div>

      {/* Spending Trend */}
      <SpendingTrend data={data?.trendData || []} currency={currency} />

      {/* Category Breakdown + Weekly */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CategoryPie data={data?.categoryData || []} />
        <WeeklyBar data={data?.weeklyData || []} currency={currency} />
      </div>

      {/* Recent Invoices */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Recent Invoices</h3>
          <Link href="/invoices" className="text-xs text-accent hover:underline">
            View all →
          </Link>
        </div>
        {data?.recentInvoices && data.recentInvoices.length > 0 ? (
          <div className="space-y-3">
            {data.recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-elevated/50 border border-border/50"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: (inv.category_color || '#6b7280') + '20' }}
                >
                  {inv.category_icon || <Package size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate">{inv.title}</p>
                    {inv.group_id && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent/20 text-accent border border-accent/30" title="Part of a Group">
                        G
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted" suppressHydrationWarning>
                    {new Date(inv.date).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      month: 'short',
                      day: 'numeric',
                    })}
                    {inv.category_name && ` · ${inv.category_name}`}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${
                    inv.type === 'income' ? 'text-income' : 'text-expense'
                  }`}
                >
                  {inv.type === 'income' ? '+' : '-'}{currency}
                  {parseFloat(String(inv.amount)).toLocaleString('en-IN')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted text-center py-8">No invoices yet</p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  currency,
  isCount,
}: {
  label: string;
  value: number;
  currency?: string;
  isCount?: boolean;
}) {
  return (
    <div className="card">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className="text-lg font-bold text-foreground">
        {isCount ? value : `${currency}${value.toLocaleString('en-IN')}`}
      </p>
    </div>
  );
}

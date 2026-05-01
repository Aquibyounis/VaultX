'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ClipboardList, Trash2, Package } from 'lucide-react';

interface Invoice {
  id: number;
  title: string;
  amount: number;
  type: string;
  date: string;
  note: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  group_id: number | null;
}

interface Category {
  id: number;
  name: string;
}

export default function InvoicesPage() {
  const pathname = usePathname();
  const { isEditor } = useSession();
  const { currency, showToast, refreshBalance } = useApp();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: page.toString(), _t: Date.now().toString() });
      if (typeFilter) params.set('type', typeFilter);
      if (categoryFilter) params.set('category_id', categoryFilter);

      const res = await fetch(`/api/invoices?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices);
        setTotalPages(data.pagination.totalPages);
      }
    } catch {
      showToast('Failed to load invoices', 'error');
    }
    setLoading(false);
  }, [page, typeFilter, categoryFilter, showToast]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices, pathname]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) setCategories(await res.json());
      } catch {}
    };
    fetchCategories();
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/invoices/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Invoice deleted', 'success');
        fetchInvoices();
        refreshBalance();
      } else {
        showToast('Failed to delete', 'error');
      }
    } catch {
      showToast('Failed to delete', 'error');
    }
    setDeleteTarget(null);
  };

  return (
    <div className="page-enter space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Invoices</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        {/* Type filter */}
        <div className="flex bg-surface border border-border rounded-xl overflow-hidden">
          {['', 'expense', 'income'].map((t) => (
            <button
              key={t}
              onClick={() => { setTypeFilter(t); setPage(1); }}
              className={`px-4 py-2 text-xs font-medium transition-all ${
                typeFilter === t
                  ? 'bg-accent text-black'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="bg-surface border border-border rounded-xl px-3 py-2 text-xs text-foreground cursor-pointer"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Invoice List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-16">
          <ClipboardList className="mx-auto w-12 h-12 text-muted mb-4 opacity-50" />
          <p className="text-muted">No invoices found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center gap-3 p-4 bg-surface border border-border rounded-2xl hover:border-border/80 transition-all group"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
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
                <p className="text-xs text-muted truncate" suppressHydrationWarning>
                  {new Date(inv.date).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                  {inv.category_name && ` · ${inv.category_name}`}
                  {inv.note && ` · ${inv.note}`}
                </p>
              </div>
              <span
                className={`text-sm font-semibold shrink-0 ${
                  inv.type === 'income' ? 'text-income' : 'text-expense'
                }`}
              >
                {inv.type === 'income' ? '+' : '-'}{currency}
                {parseFloat(String(inv.amount)).toLocaleString('en-IN')}
              </span>
              {isEditor && (
                <button
                  onClick={() => setDeleteTarget(inv.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted hover:text-expense transition-all p-1 shrink-0 ml-1"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="btn-ghost text-sm"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="btn-ghost text-sm"
          >
            Next →
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Delete Invoice"
        message="This will delete the invoice and reverse its balance impact. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}

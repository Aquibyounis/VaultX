'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import { ArrowLeft, Trash2, LayoutGrid, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

interface GroupDetails {
  id: number;
  name: string;
  total_expense: number;
  total_income: number;
  invoices: any[];
}

export default function GroupDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isEditor, isViewer } = useSession();
  const { currency, showToast, refreshBalance } = useApp();
  
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Mini form state
  const [categories, setCategories] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchGroup = async () => {
    try {
      const res = await fetch(`/api/groups/${params.id}?_t=${Date.now()}`);
      if (res.ok) {
        setGroup(await res.json());
      } else {
        router.push('/groups');
      }
    } catch {
      showToast('Failed to load group', 'error');
    }
    setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories?_t=${Date.now()}`);
      if (res.ok) setCategories(await res.json());
    } catch {}
  };

  useEffect(() => {
    if (!isViewer) {
      fetchGroup();
      fetchCategories();
    } else {
      router.push('/');
    }
  }, [isViewer]);

  const handleDeleteInvoice = async (invoiceId: number) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Invoice deleted', 'success');
        refreshBalance();
        fetchGroup();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) return;
    
    setAdding(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parseFloat(amount),
          type,
          category_id: categoryId,
          group_id: parseInt(params.id),
          date: new Date().toISOString(),
        }),
      });

      if (res.ok) {
        showToast('Added to group', 'success');
        refreshBalance();
        setTitle('');
        setAmount('');
        // Refresh group data to update totals and list
        fetchGroup();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
    setAdding(false);
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('Are you sure you want to delete this group? All invoices inside it will also be deleted!')) {
      return;
    }
    
    setDeleting(true);
    try {
      const res = await fetch(`/api/groups/${params.id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('Group deleted', 'success');
        refreshBalance();
        router.push('/groups');
      } else {
        showToast('Failed to delete group', 'error');
        setDeleting(false);
      }
    } catch {
      showToast('Connection error', 'error');
      setDeleting(false);
    }
  };

  if (loading || !group) {
    return (
      <div className="max-w-2xl mx-auto flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="page-enter max-w-2xl mx-auto pb-24 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/groups" className="p-2 -ml-2 rounded-xl text-muted hover:text-foreground hover:bg-elevated transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
            <LayoutGrid size={20} />
          </div>
          <h1 className="text-xl font-bold text-foreground">{group.name}</h1>
        </div>
        <button 
          onClick={handleDeleteGroup}
          disabled={deleting}
          className="p-2 rounded-xl text-muted hover:text-expense hover:bg-expense/10 transition-colors disabled:opacity-50"
          title="Delete Group"
        >
          <Trash2 size={20} />
        </button>
      </div>

      {/* Totals Bar */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-elevated border border-border rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">Total Spent</p>
          <p className="text-xl font-bold text-expense">{currency}{group.total_expense.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-elevated border border-border rounded-2xl p-4">
          <p className="text-xs text-muted mb-1">Total Received</p>
          <p className="text-xl font-bold text-income">{currency}{group.total_income.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Mini Add Form */}
      <div className="bg-surface border border-border rounded-2xl p-4 mb-8 shadow-sm">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
          <Plus size={16} className="text-accent" /> Quick Add to Group
        </h3>
        <form onSubmit={handleAddInvoice} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What was this for?"
                className="w-full text-sm bg-elevated border-border"
                required
              />
            </div>
            <div className="w-full sm:w-32 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted text-sm">{currency}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full text-sm bg-elevated border-border !pl-7"
                required
              />
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-1 hide-scrollbar">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as 'expense' | 'income')}
                className="text-xs bg-elevated border-border rounded-lg py-2 px-3 text-foreground"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <select
                value={categoryId || ''}
                onChange={(e) => setCategoryId(e.target.value ? parseInt(e.target.value) : null)}
                className="text-xs bg-elevated border-border rounded-lg py-2 px-3 text-foreground max-w-[120px]"
              >
                <option value="">No Category</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={adding}
              className="w-full sm:w-auto bg-accent text-black px-6 py-2 rounded-xl text-sm font-medium disabled:opacity-50 shrink-0"
            >
              {adding ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>

      {/* Invoices List */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-4">Group Invoices</h3>
        {group.invoices.length === 0 ? (
          <div className="text-center py-10 bg-surface/50 border border-dashed border-border rounded-2xl">
            <FileText className="w-10 h-10 text-muted mx-auto mb-2 opacity-50" />
            <p className="text-sm text-muted">No invoices in this group yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {group.invoices.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-4 bg-elevated border border-border rounded-2xl">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                    style={{ backgroundColor: inv.category_color ? `${inv.category_color}20` : '#3f3f46', color: inv.category_color || '#a1a1aa' }}
                  >
                    {inv.category_icon || '📄'}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground mb-0.5">{inv.title}</p>
                    <p className="text-[10px] text-muted">
                      {new Date(inv.date).toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', month: 'short', day: 'numeric' })}
                      {inv.category_name && ` • ${inv.category_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <p className={`font-bold text-sm ${inv.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                    {inv.type === 'expense' ? '-' : '+'}{currency}{inv.amount.toLocaleString('en-IN')}
                  </p>
                  <button 
                    onClick={() => handleDeleteInvoice(inv.id)}
                    className="p-1.5 text-muted hover:text-expense hover:bg-expense/10 rounded-lg transition-colors"
                    title="Delete Invoice"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

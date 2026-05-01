'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import { Lock } from 'lucide-react';
import DateCarousel from '@/components/DateCarousel';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
}

export default function AddInvoicePage() {
  const router = useRouter();
  const { isViewer } = useSession();
  const { currency, showToast, refreshBalance } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState('');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`/api/categories?_t=${Date.now()}`);
        if (res.ok) setCategories(await res.json());
      } catch {}
    };
    fetchCategories();
  }, []);

  if (isViewer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Lock className="w-12 h-12 text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted">Editor access required to add invoices</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !amount) {
      showToast('Title and amount are required', 'error');
      return;
    }

    setLoading(true);
    try {
      // Create a final date with selected day but current time
      const finalDate = new Date(selectedDate);
      const now = new Date();
      finalDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds());

      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          amount: parseFloat(amount),
          type,
          category_id: categoryId,
          date: finalDate.toISOString(),
          note: note.trim() || null,
        }),
      });

      if (res.ok) {
        showToast('Invoice added successfully', 'success');
        refreshBalance();
        router.push('/invoices');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to add invoice', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
    setLoading(false);
  };

  return (
    <div className="page-enter max-w-lg mx-auto pb-24 md:pb-8">
      <h1 className="text-xl font-bold text-foreground mb-6">Add Invoice</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="text-xs text-muted mb-1.5 block px-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Grocery shopping"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="text-xs text-muted mb-1.5 block px-1">Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">{currency}</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              required
              className="!pl-8"
            />
          </div>
        </div>

        {/* Type toggle */}
        <div>
          <label className="text-xs text-muted mb-1.5 block px-1">Type</label>
          <div className="flex bg-surface border border-border rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                type === 'expense'
                  ? 'bg-expense text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                type === 'income'
                  ? 'bg-income text-white'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Income
            </button>
          </div>
        </div>

        {/* Category selector */}
        <div>
          <label className="text-xs text-muted mb-1.5 block px-1">Category</label>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  categoryId === cat.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border bg-surface text-muted hover:text-foreground'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Date Carousel */}
        <div className="pt-2">
          <DateCarousel 
            selectedDate={selectedDate} 
            onChange={setSelectedDate} 
          />
        </div>

        {/* Note */}
        <div>
          <label className="text-xs text-muted mb-1.5 block px-1">Note (optional)</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-primary w-full h-14 rounded-2xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-transform">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
              Adding...
            </span>
          ) : (
            'Add Invoice'
          )}
        </button>
      </form>
    </div>
  );
}

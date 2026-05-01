'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { FolderOpen, Trash2, Plus } from 'lucide-react';

interface Category {
  id: number;
  name: string;
  icon: string;
  color: string;
  total_spent: number;
}

const EMOJI_LIST = ['🍔','🚗','🛍️','📄','🎮','💊','📚','📦','🏠','💰','✈️','☕','🎬','🏋️','🎵','🐾','👗','💻','🔧','🎁','💡','🍕','🚌','💳','📱','🏥','🎓','🌐'];
const COLOR_LIST = ['#f97316','#3b82f6','#a855f7','#eab308','#ec4899','#14b8a6','#6366f1','#6b7280','#ef4444','#22c55e','#f43f5e','#0ea5e9','#84cc16','#d946ef'];

export default function CategoriesPage() {
  const pathname = usePathname();
  const { isEditor } = useSession();
  const { currency, showToast } = useApp();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState('#6b7280');
  const [creating, setCreating] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`/api/categories?_t=${Date.now()}`);
      if (res.ok) setCategories(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, [pathname]);

  const handleCreate = async () => {
    if (!name.trim()) { showToast('Name required', 'error'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), icon, color }),
      });
      if (res.ok) {
        showToast('Category created', 'success');
        setShowModal(false); setName(''); setIcon('📦'); setColor('#6b7280');
        fetchCategories();
      } else { const d = await res.json(); showToast(d.error || 'Failed', 'error'); }
    } catch { showToast('Error', 'error'); }
    setCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/categories/${deleteTarget}`, { method: 'DELETE' });
      if (res.ok) { showToast('Deleted', 'success'); fetchCategories(); }
      else showToast('Failed', 'error');
    } catch { showToast('Error', 'error'); }
    setDeleteTarget(null);
  };

  return (
    <div className="page-enter space-y-6 pb-24 md:pb-8">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">Categories</h1>
        {isEditor && <button onClick={() => setShowModal(true)} className="btn-primary text-sm !py-2 !px-4 flex items-center gap-2"><Plus size={16} /> Add</button>}
      </div>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : categories.length === 0 ? (
        <div className="text-center py-16"><FolderOpen className="mx-auto w-12 h-12 text-muted mb-4 opacity-50" /><p className="text-muted">No categories</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-surface border border-border rounded-2xl p-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ backgroundColor: cat.color }} />
              <div className="flex items-center gap-3 pl-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: cat.color + '20' }}>{cat.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{cat.name}</p>
                  <p className="text-xs text-muted">{currency} {parseFloat(String(cat.total_spent)).toLocaleString('en-IN')} spent</p>
                </div>
                {isEditor && <button onClick={() => setDeleteTarget(cat.id)} className="opacity-0 group-hover:opacity-100 text-muted hover:text-expense transition-all p-1 shrink-0"><Trash2 size={16} /></button>}
              </div>
            </div>
          ))}
        </div>
      )}
      {showModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-scale-in space-y-4">
            <h3 className="text-lg font-bold text-foreground">Add Category</h3>
            <div><label className="text-xs text-muted mb-1.5 block">Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Category name" autoFocus /></div>
            <div><label className="text-xs text-muted mb-1.5 block">Icon</label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-elevated rounded-xl border border-border">
                {EMOJI_LIST.map((e) => (<button key={e} type="button" onClick={() => setIcon(e)} className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${icon === e ? 'bg-accent/20 ring-2 ring-accent' : 'hover:bg-elevated'}`}>{e}</button>))}
              </div>
            </div>
            <div><label className="text-xs text-muted mb-1.5 block">Color</label>
              <div className="flex flex-wrap gap-2">{COLOR_LIST.map((c) => (<button key={c} type="button" onClick={() => setColor(c)} className={`w-8 h-8 rounded-full ${color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-background scale-110' : ''}`} style={{ backgroundColor: c }} />))}</div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-xl text-sm text-muted bg-elevated border border-border">Cancel</button>
              <button onClick={handleCreate} disabled={creating || !name.trim()} className="btn-primary text-sm !py-2 !px-4">{creating ? 'Creating...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog isOpen={!!deleteTarget} title="Delete Category" message="Delete this category? Invoices will lose their category." confirmText="Delete" onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
    </div>
  );
}

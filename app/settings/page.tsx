'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import { Lock, AlertTriangle } from 'lucide-react';

const CURRENCIES = ['₹', '$', '€', '£'];

export default function SettingsPage() {
  const { isViewer } = useSession();
  const { balance, currency, setCurrency, refreshBalance, showToast, pingStatus } = useApp();
  const [newBalance, setNewBalance] = useState('');
  const [saving, setSaving] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => { refreshBalance(); }, [refreshBalance]);

  if (isViewer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Lock className="w-12 h-12 text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted">Editor access required</p>
      </div>
    );
  }

  const handleBalanceSave = async () => {
    const val = parseFloat(newBalance);
    if (isNaN(val)) { showToast('Enter a valid number', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/account', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ balance: val }),
      });
      if (res.ok) { showToast('Balance updated', 'success'); refreshBalance(); setNewBalance(''); }
      else showToast('Failed to update', 'error');
    } catch { showToast('Error', 'error'); }
    setSaving(false);
  };

  const handleCurrencyChange = async (c: string) => {
    setCurrency(c);
    try {
      await fetch('/api/account', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: c }),
      });
      showToast(`Currency set to ${c}`, 'success');
    } catch {}
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) { showToast('All data reset', 'success'); refreshBalance(); }
      else showToast('Reset failed', 'error');
    } catch { showToast('Error', 'error'); }
    setResetting(false);
    setShowReset(false);
  };

  return (
    <div className="page-enter space-y-6 max-w-lg mx-auto pb-24 md:pb-8">
      <h1 className="text-xl font-bold text-foreground">Settings</h1>

      {/* Balance */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">Edit Balance</h3>
        <p className="text-xs text-yellow-400 flex items-center gap-1.5"><AlertTriangle size={14} /> This overrides the current balance ({currency}{balance.toLocaleString('en-IN')})</p>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted">{currency}</span>
            <input type="number" value={newBalance} onChange={(e) => setNewBalance(e.target.value)} placeholder="New balance" className="!pl-8" />
          </div>
          <button onClick={handleBalanceSave} disabled={saving || !newBalance} className="btn-primary text-sm !py-2 !px-4">{saving ? '...' : 'Save'}</button>
        </div>
      </div>

      {/* Currency */}
      <div className="card space-y-3">
        <h3 className="text-sm font-semibold">Currency Symbol</h3>
        <div className="flex gap-2">
          {CURRENCIES.map((c) => (
            <button key={c} onClick={() => handleCurrencyChange(c)}
              className={`w-12 h-12 rounded-xl text-lg font-bold border transition-all ${currency === c ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-elevated text-muted hover:text-foreground'}`}>{c}</button>
          ))}
        </div>
      </div>

      {/* App Info */}
      <div className="card space-y-2">
        <h3 className="text-sm font-semibold">App Info</h3>
        <div className="space-y-1 text-xs text-muted">
          <p>Version: 1.0.0</p>
          <p className="flex items-center gap-2">Database: <span className={`inline-flex items-center gap-1 ${pingStatus === 'ok' ? 'text-income' : 'text-expense'}`}><span className={`w-2 h-2 rounded-full ${pingStatus === 'ok' ? 'bg-income' : 'bg-expense'}`} />{pingStatus === 'ok' ? 'Connected' : 'Disconnected'}</span></p>
          <p>Framework: Next.js 14</p>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="card border-expense/30 space-y-3">
        <h3 className="text-sm font-semibold text-expense">Danger Zone</h3>
        <p className="text-xs text-muted">This will delete all invoices, categories, and reset the balance to 0.</p>
        <button onClick={() => setShowReset(true)} disabled={resetting} className="btn-danger text-sm !py-2 !px-4">Reset All Data</button>
      </div>

      <ConfirmDialog isOpen={showReset} title="Reset All Data" message="This will permanently delete ALL invoices, categories, and reset your balance. This cannot be undone." confirmText="Reset Everything" requireType="DELETE" onConfirm={handleReset} onCancel={() => setShowReset(false)} />
    </div>
  );
}

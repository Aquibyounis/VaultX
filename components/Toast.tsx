'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';

export default function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-16 right-4 z-[100] space-y-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border animate-slide-down cursor-pointer transition-opacity hover:opacity-80 ${
            toast.type === 'success'
              ? 'bg-income/10 border-income/30 text-income'
              : toast.type === 'error'
              ? 'bg-expense/10 border-expense/30 text-expense'
              : toast.type === 'warning'
              ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="text-sm">
            {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : 'ℹ'}
          </span>
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      ))}
    </div>
  );
}

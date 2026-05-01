'use client';

import React, { useState } from 'react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  requireType?: string; // e.g., "DELETE"
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  requireType,
  onConfirm,
  onCancel,
  variant = 'danger',
}: ConfirmDialogProps) {
  const [typedText, setTypedText] = useState('');

  if (!isOpen) return null;

  const canConfirm = requireType ? typedText === requireType : true;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-surface border border-border rounded-2xl p-6 max-w-md w-full animate-scale-in">
        <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
        <p className="text-sm text-muted mb-4">{message}</p>

        {requireType && (
          <div className="mb-4">
            <p className="text-xs text-muted mb-2">
              Type <span className="text-expense font-mono font-bold">{requireType}</span> to confirm:
            </p>
            <input
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              className="w-full bg-elevated border border-border rounded-xl px-4 py-2 text-sm text-foreground focus:border-expense transition-colors"
              placeholder={requireType}
              autoFocus
            />
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { setTypedText(''); onCancel(); }}
            className="px-4 py-2 rounded-xl text-sm font-medium text-muted hover:text-foreground bg-elevated border border-border transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => { setTypedText(''); onConfirm(); }}
            disabled={!canConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-30 ${
              variant === 'danger'
                ? 'bg-expense text-white hover:opacity-90'
                : 'bg-yellow-500 text-black hover:opacity-90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

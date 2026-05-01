'use client';

import React, { useState, useCallback, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { Delete } from 'lucide-react';

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

function LockPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshSession } = useSession();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const expired = searchParams.get('reason') === 'expired';

  const handleKey = useCallback(
    (key: string) => {
      if (loading) return;
      setError('');

      if (key === 'del') {
        setPin((prev) => prev.slice(0, -1));
        return;
      }

      if (key === '' || pin.length >= 4) return;
      
      const newPin = pin + key;
      setPin(newPin);

      if (newPin.length === 4) {
        submitPin(newPin);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pin, loading]
  );

  const submitPin = async (value: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: value }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(
          'mt_session',
          JSON.stringify({ role: data.role, expiresAt: data.expiresAt })
        );
        refreshSession();
        router.push('/');
      } else {
        setShaking(true);
        setError('Invalid PIN');
        setPin('');
        setTimeout(() => setShaking(false), 500);
      }
    } catch {
      setError('Connection error');
      setPin('');
    }
    setLoading(false);
  };

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') handleKey(e.key);
      else if (e.key === 'Backspace') handleKey('del');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleKey]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-8 text-center">
        <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 shadow-lg shadow-accent/20">
          <Image src="/icons/icon-192.png" alt="VaultX Logo" width={80} height={80} priority />
        </div>
        <h1 className="text-2xl font-bold text-foreground">VaultX</h1>
        <p className="text-sm text-muted mt-1">Enter your PIN to unlock</p>
      </div>

      {/* Expired message */}
      {expired && (
        <div className="mb-6 px-4 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30">
          <p className="text-xs text-yellow-400">Session expired. Please re-enter your PIN.</p>
        </div>
      )}

      {/* PIN dots */}
      <div className={`flex gap-4 mb-8 ${shaking ? 'animate-shake' : ''}`}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
              i < pin.length
                ? 'bg-accent border-accent scale-110'
                : 'border-border bg-transparent'
            }`}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="text-expense text-sm mb-4 animate-fade-in">{error}</p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3 max-w-xs w-full">
        {keys.map((key, i) => (
          <button
            key={i}
            onClick={() => handleKey(key)}
            disabled={key === '' || loading}
            className={`h-16 rounded-2xl flex items-center justify-center text-xl font-semibold transition-all active:scale-95 ${
              key === ''
                ? 'invisible'
                : key === 'del'
                ? 'bg-elevated border border-border text-muted hover:text-foreground hover:border-expense/50'
                : 'bg-surface border border-border text-foreground hover:bg-elevated hover:border-accent/30'
            }`}
          >
            {key === 'del' ? <Delete size={24} /> : key}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="mt-6 flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted">Unlocking...</span>
        </div>
      )}
    </div>
  );
}

export default function LockPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LockPageContent />
    </Suspense>
  );
}

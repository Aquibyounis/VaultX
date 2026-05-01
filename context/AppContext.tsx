'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface AppState {
  balance: number;
  currency: string;
  setCurrency: (c: string) => void;
  refreshBalance: () => Promise<void>;
  pingStatus: 'ok' | 'error' | 'unknown';
  toasts: Toast[];
  showToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
}

const AppContext = createContext<AppState>({
  balance: 0,
  currency: '₹',
  setCurrency: () => {},
  refreshBalance: async () => {},
  pingStatus: 'unknown',
  toasts: [],
  showToast: () => {},
  removeToast: () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [balance, setBalance] = useState(0);
  const [currency, setCurrencyState] = useState('₹');
  const [pingStatus, setPingStatus] = useState<'ok' | 'error' | 'unknown'>('unknown');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const failCountRef = useRef(0);

  const refreshBalance = useCallback(async () => {
    try {
      const res = await fetch(`/api/account?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setBalance(parseFloat(data.balance) || 0);
        if (data.currency) setCurrencyState(data.currency);
      }
    } catch {}
  }, []);

  const setCurrency = useCallback((c: string) => {
    setCurrencyState(c);
  }, []);

  // Ping mechanism
  useEffect(() => {
    const ping = async () => {
      try {
        const res = await fetch('/api/ping');
        if (res.ok) {
          setPingStatus('ok');
          failCountRef.current = 0;
        } else {
          throw new Error('Ping failed');
        }
      } catch {
        failCountRef.current++;
        setPingStatus('error');
        console.error('Neon ping failed');
        if (failCountRef.current >= 3) {
          showToast('Reconnecting to database…', 'warning');
        }
      }
    };

    ping(); // Initial ping
    const interval = setInterval(ping, 4 * 60 * 1000); // Every 4 minutes
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        balance,
        currency,
        setCurrency,
        refreshBalance,
        pingStatus,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}

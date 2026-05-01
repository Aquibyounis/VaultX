'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SessionState {
  role: 'editor' | 'viewer' | null;
  expiresAt: number | null;
  isEditor: boolean;
  isViewer: boolean;
  isAuthenticated: boolean;
  timeRemaining: number;
  lock: () => Promise<void>;
  refreshSession: () => void;
}

const SessionContext = createContext<SessionState>({
  role: null,
  expiresAt: null,
  isEditor: false,
  isViewer: false,
  isAuthenticated: false,
  timeRemaining: 0,
  lock: async () => {},
  refreshSession: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [role, setRole] = useState<'editor' | 'viewer' | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mt_session');
    if (stored) {
      try {
        const { role: r, expiresAt: e } = JSON.parse(stored);
        if (Date.now() < e) {
          setRole(r);
          setExpiresAt(e);
        } else {
          localStorage.removeItem('mt_session');
        }
      } catch {
        localStorage.removeItem('mt_session');
      }
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) {
      setTimeRemaining(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, expiresAt - Date.now());
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        handleAutoLock();
      }
    };

    updateCountdown();
    countdownRef.current = setInterval(updateCountdown, 1000);

    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expiresAt]);

  const handleAutoLock = useCallback(async () => {
    localStorage.removeItem('mt_session');
    setRole(null);
    setExpiresAt(null);
    try {
      await fetch('/api/auth/lock', { method: 'POST' });
    } catch {}
    router.push('/lock?reason=expired');
  }, [router]);

  // Activity listener - reset session timer
  const resetTimer = useCallback(() => {
    if (!role || !expiresAt) return;

    const newExpiry = Date.now() + 60 * 60 * 1000;
    setExpiresAt(newExpiry);
    localStorage.setItem('mt_session', JSON.stringify({ role, expiresAt: newExpiry }));
    
    // Refresh server-side cookie
    fetch('/api/auth/refresh', { method: 'POST' }).catch(() => {});
  }, [role, expiresAt]);

  useEffect(() => {
    if (!role) return;

    const events = ['click', 'scroll', 'keypress', 'touchstart', 'mousemove'];
    const throttledReset = throttle(resetTimer, 30000); // Throttle to once per 30s

    events.forEach(e => window.addEventListener(e, throttledReset));
    return () => {
      events.forEach(e => window.removeEventListener(e, throttledReset));
    };
  }, [role, resetTimer]);

  const lock = async () => {
    localStorage.removeItem('mt_session');
    setRole(null);
    setExpiresAt(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    try {
      await fetch('/api/auth/lock', { method: 'POST' });
    } catch {}
    router.push('/lock');
  };

  const refreshSession = useCallback(() => {
    const stored = localStorage.getItem('mt_session');
    if (stored) {
      try {
        const { role: r, expiresAt: e } = JSON.parse(stored);
        setRole(r);
        setExpiresAt(e);
      } catch {}
    }
  }, []);

  return (
    <SessionContext.Provider
      value={{
        role,
        expiresAt,
        isEditor: role === 'editor',
        isViewer: role === 'viewer',
        isAuthenticated: !!role,
        timeRemaining,
        lock,
        refreshSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}

// Throttle helper
function throttle(fn: () => void, ms: number) {
  let lastCall = 0;
  return () => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn();
    }
  };
}

'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SessionProvider } from '@/context/SessionContext';
import { AppProvider } from '@/context/AppContext';
import Navbar from '@/components/Navbar';
import ToastContainer from '@/components/Toast';

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLockPage = pathname === '/lock';

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.log('SW registration failed:', err);
      });
    }
  }, []);

  return (
    <SessionProvider>
      <AppProvider>
        <ToastContainer />
        <Navbar />
        <main className={`min-h-screen ${!isLockPage ? 'pt-16 pb-4 px-4 md:pl-64 md:pt-20 md:px-8' : ''}`}>
          {children}
        </main>
      </AppProvider>
    </SessionProvider>
  );
}

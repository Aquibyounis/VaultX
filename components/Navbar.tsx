'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import { Home, ClipboardList, Plus, Folder, BarChart3, Settings, Lock, AlertTriangle, LayoutGrid, FileText } from 'lucide-react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/invoices', label: 'Invoices', icon: ClipboardList },
  { href: '/add', label: 'Add', icon: Plus, isAdd: true },
  { href: '/categories', label: 'Categories', icon: Folder },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
];

const sidebarItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/invoices', label: 'Invoices', icon: ClipboardList },
  { href: '/add', label: 'Add Invoice', icon: Plus },
  { href: '/groups', label: 'Groups', icon: LayoutGrid, isEditorOnly: true },
  { href: '/categories', label: 'Categories', icon: Folder },
  { href: '/stats', label: 'Stats', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function Navbar() {
  const pathname = usePathname();
  const { role, isEditor, isViewer, timeRemaining, lock, isAuthenticated } = useSession();
  const { pingStatus, showToast } = useApp();
  const [showAddMenu, setShowAddMenu] = useState(false);

  if (!isAuthenticated || pathname === '/lock') return null;

  const isWarning = timeRemaining <= 60000 && timeRemaining > 0;

  const handleAddClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isViewer) {
      showToast('View-only mode', 'warning');
      return;
    }
    setShowAddMenu(!showAddMenu);
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-border flex-col z-50">
        {/* Logo */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-accent/20">
              <Image src="/icons/icon-192.png" alt="VaultX Logo" width={40} height={40} priority />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">VaultX</h1>
              <p className="text-xs text-muted">Money Tracker</p>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {sidebarItems.map((item) => {
            if (item.isEditorOnly && !isEditor) return null;
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-muted hover:text-foreground hover:bg-elevated'
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-border space-y-3">
          {/* Session Timer */}
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  pingStatus === 'ok' ? 'bg-income animate-pulse-dot' : 
                  pingStatus === 'error' ? 'bg-expense' : 'bg-muted'
                }`}
              />
              <span className={`text-xs font-mono ${isWarning ? 'text-yellow-400' : 'text-muted'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
              isEditor ? 'bg-income/15 text-income' : 'bg-yellow-500/15 text-yellow-400'
            }`}>
              {role?.toUpperCase()}
            </span>
          </div>

          {/* Lock Button */}
          <button
            onClick={lock}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-elevated border border-border text-muted hover:text-foreground hover:border-expense/50 transition-all text-sm"
          >
            <Lock size={16} />
            <span>Lock</span>
          </button>
        </div>
      </aside>

      {/* Desktop Top Bar */}
      <header className="hidden md:flex fixed top-0 left-60 right-0 h-14 bg-surface/80 backdrop-blur-xl border-b border-border items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted" suppressHydrationWarning>
            {new Date().toLocaleDateString('en-IN', {
              timeZone: 'Asia/Kolkata',
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {isWarning && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/30">
            <AlertTriangle size={14} className="text-yellow-400" />
            <span className="text-yellow-400 text-xs font-medium">
              Session expiring in {formatTime(timeRemaining)}
            </span>
          </div>
        )}
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-surface/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden">
            <Image src="/icons/icon-192.png" alt="VaultX Logo" width={32} height={32} priority />
          </div>
          <span className="font-bold text-foreground">VaultX</span>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`w-2 h-2 rounded-full ${
              pingStatus === 'ok' ? 'bg-income animate-pulse-dot' : 
              pingStatus === 'error' ? 'bg-expense' : 'bg-muted'
            }`}
          />
          <span className={`text-xs font-mono ${isWarning ? 'text-yellow-400' : 'text-muted'}`}>
            {formatTime(timeRemaining)}
          </span>
          <button
            onClick={lock}
            className="p-2 rounded-lg hover:bg-elevated transition-colors text-muted hover:text-foreground"
          >
            <Lock size={18} />
          </button>
        </div>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-surface/95 backdrop-blur-xl border-t border-border flex items-center justify-around px-2 z-50 pb-safe">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.isAdd) {
            return (
              <div key="add-btn" className="relative -mt-6">
                {showAddMenu && (
                  <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col gap-2 bg-elevated border border-border rounded-2xl p-2 shadow-2xl animate-in slide-in-from-bottom-2 z-50">
                    <Link href="/add" onClick={() => setShowAddMenu(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-surface rounded-xl text-sm font-medium text-foreground whitespace-nowrap">
                      <FileText size={18} className="text-accent" /> Invoice
                    </Link>
                    {isEditor && (
                      <Link href="/groups" onClick={() => setShowAddMenu(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-surface rounded-xl text-sm font-medium text-foreground whitespace-nowrap">
                        <LayoutGrid size={18} className="text-accent" /> Group
                      </Link>
                    )}
                  </div>
                )}
                <button
                  onClick={handleAddClick}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-lg ${
                    isViewer
                      ? 'bg-muted/30 text-muted'
                      : 'bg-accent text-black hover:scale-105 active:scale-95'
                  }`}
                >
                  <Icon size={28} className={showAddMenu ? 'rotate-45 transition-transform' : 'transition-transform'} />
                </button>
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                isActive ? 'text-accent' : 'text-muted'
              }`}
            >
              <Icon size={22} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/context/SessionContext';
import { useApp } from '@/context/AppContext';
import { LayoutGrid, Plus, Lock, ArrowRight, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import DateCarousel from '@/components/DateCarousel';

interface Group {
  id: number;
  name: string;
  total_expense: number;
  total_income: number;
}

export default function GroupsPage() {
  const router = useRouter();
  const { isEditor, isViewer } = useSession();
  const { currency, showToast } = useApp();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    try {
      const res = await fetch(`/api/groups?_t=${Date.now()}`);
      if (res.ok) {
        setGroups(await res.json());
      }
    } catch {
      showToast('Failed to load groups', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  if (isViewer) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Lock className="w-12 h-12 text-muted mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        <p className="text-sm text-muted">Editor access required for Groups</p>
      </div>
    );
  }

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    
    setCreating(true);
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newGroupName,
          created_at: selectedDate.toISOString()
        }),
      });
      
      if (res.ok) {
        const newGroup = await res.json();
        setGroups([{
          ...newGroup,
          total_expense: 0,
          total_income: 0
        }, ...groups]);
        setNewGroupName('');
        setShowCreate(false);
        showToast('Group created successfully', 'success');
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to create group', 'error');
      }
    } catch {
      showToast('Connection error', 'error');
    }
    setCreating(false);
  };

  return (
    <div className="page-enter max-w-2xl mx-auto pb-24 md:pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Groups</h1>
          <p className="text-sm text-muted">Organize your expenses into collections</p>
        </div>
        {!showCreate && (
          <button 
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-accent text-black px-4 py-2 rounded-xl text-sm font-medium hover:scale-105 active:scale-95 transition-all"
          >
            <Plus size={16} /> New Group
          </button>
        )}
      </div>

      {showCreate && (
        <form onSubmit={handleCreateGroup} className="mb-8 p-6 bg-elevated border border-border rounded-2xl animate-in fade-in slide-in-from-top-4 space-y-6 shadow-xl">
          <div className="space-y-2">
            <label className="text-xs text-muted block px-1">Group Name</label>
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g., Trip to Paris, Wedding..."
              className="w-full bg-surface border-border text-sm p-4 rounded-xl"
              autoFocus
              required
            />
          </div>

          <div className="space-y-2">
            <DateCarousel selectedDate={selectedDate} onChange={setSelectedDate} />
          </div>

          <div className="flex gap-3 pt-2">
            <button 
              type="submit" 
              disabled={creating}
              className="flex-1 bg-accent text-black py-4 rounded-xl font-bold text-sm shadow-lg shadow-accent/20 active:scale-[0.98] transition-transform disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Group'}
            </button>
            <button 
              type="button"
              onClick={() => setShowCreate(false)}
              className="px-6 text-muted hover:text-foreground text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-elevated border border-border rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-surface/50">
          <LayoutGrid className="w-12 h-12 text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-foreground font-medium mb-1">No groups yet</h3>
          <p className="text-sm text-muted mb-4">Create your first group to organize related expenses.</p>
          <button 
            onClick={() => setShowCreate(true)}
            className="text-accent text-sm font-medium hover:underline"
          >
            Create Group
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {groups.map((group) => (
            <Link 
              href={`/groups/${group.id}`} 
              key={group.id}
              className="group relative bg-elevated border border-border rounded-2xl p-5 hover:border-accent/50 transition-colors"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  <LayoutGrid size={20} />
                </div>
                <ArrowRight size={18} className="text-muted group-hover:text-accent transition-colors" />
              </div>
              
              <h3 className="text-lg font-bold text-foreground mb-1">{group.name}</h3>
              
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div>
                  <p className="text-xs text-muted mb-0.5">Spent</p>
                  <p className="font-semibold text-expense">{currency}{(group.total_expense || 0).toLocaleString('en-IN')}</p>
                </div>
                {(group.total_income || 0) > 0 && (
                  <div>
                    <p className="text-xs text-muted mb-0.5">Received</p>
                    <p className="font-semibold text-income">{currency}{(group.total_income || 0).toLocaleString('en-IN')}</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

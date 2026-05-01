'use client';

import React, { useEffect, useRef } from 'react';

interface DateCarouselProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
}

export default function DateCarousel({ selectedDate, onChange }: DateCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Generate 30 days of dates (today and 29 days past)
  const dates = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); // Normalize to start of day for comparison
    d.setDate(d.getDate() - i);
    return d;
  }).reverse(); // To have today at the end (right side)

  useEffect(() => {
    // Initial scroll to the end (Today) on mount if nothing is selected or if today is selected
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, []);

  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  };

  return (
    <div className="space-y-2">
      <div 
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto py-4 px-2 hide-scrollbar snap-x snap-mandatory cursor-grab active:cursor-grabbing"
        style={{ scrollBehavior: 'smooth' }}
      >
        {dates.map((date, idx) => {
          const selected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onChange(date)}
              className={`flex-shrink-0 snap-center flex flex-col items-center justify-center w-16 h-20 rounded-2xl transition-all duration-300 ${
                selected 
                  ? 'bg-accent text-black scale-110 shadow-lg shadow-accent/30 z-10' 
                  : 'bg-elevated text-muted hover:bg-surface border border-border shadow-sm'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold tracking-tight ${selected ? 'text-black/60' : 'text-muted'}`}>
                {date.toLocaleDateString('en-IN', { weekday: 'short' })}
              </span>
              <span className={`text-xl font-black leading-none my-1 ${selected ? 'text-black' : 'text-foreground'}`}>
                {date.getDate()}
              </span>
              <span className={`text-[9px] font-medium ${selected ? 'text-black/60' : 'text-muted'}`}>
                {isToday ? 'Today' : date.toLocaleDateString('en-IN', { month: 'short' })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

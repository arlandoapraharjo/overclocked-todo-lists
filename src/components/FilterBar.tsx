import React from 'react';
import { Search, X } from 'lucide-react';
import type { FilterStatus, Category, Priority } from '../types/todo';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface FilterBarProps {
  status: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
  selectedCategory: Category | 'all';
  onCategoryChange: (category: Category | 'all') => void;
  selectedPriority: Priority | 'all';
  onPriorityChange: (priority: Priority | 'all') => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCount: number;
  completedCount: number;
  totalCount: number;
}

const CATEGORIES: (Category | 'all')[] = ['all', 'Work', 'Personal', 'Design', 'Urgent'];

export const FilterBar = React.memo(function FilterBar({
  status,
  onStatusChange,
  selectedCategory,
  onCategoryChange,
  searchQuery,
  onSearchChange,
  activeCount,
  completedCount,
  totalCount,
}: FilterBarProps) {
  const STATUS_TABS: { key: FilterStatus; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: totalCount },
    { key: 'active', label: 'Active', count: activeCount },
    { key: 'completed', label: 'Done', count: completedCount },
  ];

  return (
    <div className="w-full space-y-2.5">
      {/* Top filter row: Segmented control & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Status Segmented Tabs */}
        <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-xs">
          {STATUS_TABS.map(tab => {
            const isActive = status === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onStatusChange(tab.key)}
                className={cn(
                  "relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors select-none cursor-pointer",
                  isActive
                    ? "text-zinc-950 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeFilterPill"
                    className="absolute inset-0 bg-white dark:bg-zinc-700/80 rounded-lg shadow-xs border border-black/5 dark:border-white/10"
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
                <span className={cn(
                  "relative z-10 text-[10px] font-mono px-1 rounded-sm",
                  isActive
                    ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                    : "text-zinc-400 dark:text-zinc-500"
                )}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Compact Search Bar */}
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full sm:w-44 text-xs pl-8 pr-7 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-850 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 border border-zinc-200 dark:border-zinc-800 outline-none focus:border-zinc-400 dark:focus:border-zinc-600 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills & Reorder Hint */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5 pt-0.5 no-scrollbar">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-medium text-zinc-400 mr-0.5">Category:</span>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-md transition-colors font-medium cursor-pointer",
                selectedCategory === cat
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs"
                  : "bg-zinc-100 dark:bg-zinc-850 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              )}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-zinc-400/80 dark:text-zinc-500 shrink-0">
          <span>↕ Drag grip to reorder</span>
        </div>
      </div>
    </div>
  );
});

import React from 'react';
import {
  SunMedium,
  Sun,
  MoonStar,
  Command,
  LayoutGrid,
  List,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import type { TodoStats } from '../types/todo';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface HeaderProps {
  stats: TodoStats;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenCommand: () => void;
  onOpenAISettings: () => void;
  viewMode: 'list' | 'grid';
  onViewModeChange: (mode: 'list' | 'grid') => void;
}

export const Header = React.memo(function Header({
  stats,
  isDark,
  onToggleTheme,
  onOpenCommand,
  onOpenAISettings,
  viewMode,
  onViewModeChange,
}: HeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: SunMedium, iconColor: 'text-amber-400' };
    if (hour < 18) return { text: 'Good afternoon', icon: Sun, iconColor: 'text-amber-500' };
    return { text: 'Good evening', icon: MoonStar, iconColor: 'text-indigo-400' };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="w-full space-y-4 pt-4 pb-2">
      {/* Top utility row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
            {today}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View Mode Switcher: Grid vs List */}
          <div className="relative flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 text-xs select-none">
            <button
              type="button"
              onClick={() => onViewModeChange('list')}
              className={cn(
                "relative z-10 p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center",
                viewMode === 'list'
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
              title="Compact Unified List view"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('grid')}
              className={cn(
                "relative z-10 p-1.5 rounded-md transition-colors cursor-pointer flex items-center justify-center",
                viewMode === 'grid'
                  ? "text-zinc-950 dark:text-zinc-50"
                  : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
              )}
              title="Grid Bento Dashboard view"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <motion.div
              layoutId="activeViewPill"
              className={cn(
                "absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md bg-white dark:bg-zinc-700 shadow-xs border border-black/5 dark:border-white/10",
                viewMode === 'list' ? "left-0.5" : "left-[calc(50%+1px)]"
              )}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            />
          </div>

          {/* AI Settings Trigger */}
          <button
            type="button"
            onClick={onOpenAISettings}
            className="flex items-center gap-1 px-2 py-1 text-xs rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors shadow-xs cursor-pointer"
            title="Brain Dump & API Key Settings"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden sm:inline text-[11px] font-medium">AI Keys</span>
          </button>

          {/* Command Palette Trigger */}
          <button
            type="button"
            onClick={onOpenCommand}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors shadow-xs cursor-pointer"
            title="Command menu (Ctrl+K or Cmd+K)"
          >
            <Command className="w-3 h-3" />
            <span className="font-mono text-[10px]">⌘K</span>
          </button>

          {/* Dark / Light Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors shadow-xs cursor-pointer"
          >
            {isDark ? (
              <SunMedium className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <MoonStar className="w-3.5 h-3.5 text-zinc-600" />
            )}
          </button>
        </div>
      </div>

      {/* Main Title & Greeting (With Vector Icons, Zero Standard Emojis) */}
      <div className="flex items-baseline justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>{greeting.text}</span>
            <GreetingIcon className={cn("w-5 h-5 inline-block", greeting.iconColor)} />
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Focus on what matters most today.
          </p>
        </div>

        {/* Minimal Progress Indicator */}
        <div className="text-right">
          <div className="text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100">
            {stats.completed}/{stats.total} <span className="text-zinc-400">({stats.percent}%)</span>
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 flex items-center justify-end gap-1">
            {stats.pending === 0 && stats.total > 0 ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                <span>All completed</span>
              </>
            ) : (
              <span>{stats.pending} remaining</span>
            )}
          </div>
        </div>
      </div>

      {/* Sleek Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/60 dark:border-zinc-700/60">
        <div
          className="h-full bg-linear-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${stats.percent}%` }}
        />
      </div>
    </header>
  );
});

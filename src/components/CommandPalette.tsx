import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Command, 
  CheckCircle2, 
  Trash2, 
  RotateCcw, 
  SunMedium, 
  MoonStar, 
  ListFilter, 
  Plus, 
  Sparkles,
  LayoutGrid
} from 'lucide-react';
import type { FilterStatus } from '../types/todo';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllComplete: () => void;
  onClearCompleted: () => void;
  onResetSample: () => void;
  onToggleTheme: () => void;
  isDark: boolean;
  onFilterChange: (status: FilterStatus) => void;
  onFocusAdd: () => void;
  onOpenAISettings?: () => void;
}

export function CommandPalette({
  isOpen,
  onClose,
  onMarkAllComplete,
  onClearCompleted,
  onResetSample,
  onToggleTheme,
  isDark,
  onFilterChange,
  onFocusAdd,
  onOpenAISettings,
}: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isOpen, onClose]);

  const ACTIONS = [
    {
      id: 'add',
      label: 'Create new task',
      icon: Plus,
      run: () => {
        onClose();
        onFocusAdd();
      },
    },
    {
      id: 'ai-settings',
      label: 'Configure AI Provider & API Keys',
      icon: Sparkles,
      run: () => {
        onClose();
        if (onOpenAISettings) onOpenAISettings();
      },
    },
    {
      id: 'mark-all',
      label: 'Mark all tasks completed',
      icon: CheckCircle2,
      run: () => {
        onMarkAllComplete();
        onClose();
      },
    },
    {
      id: 'clear-done',
      label: 'Clear completed tasks',
      icon: Trash2,
      run: () => {
        onClearCompleted();
        onClose();
      },
    },
    {
      id: 'theme',
      label: `Switch to ${isDark ? 'Light' : 'Dark'} mode`,
      icon: isDark ? SunMedium : MoonStar,
      run: () => {
        onToggleTheme();
        onClose();
      },
    },
    {
      id: 'filter-active',
      label: 'Show only active tasks',
      icon: ListFilter,
      run: () => {
        onFilterChange('active');
        onClose();
      },
    },
    {
      id: 'filter-all',
      label: 'Show all tasks',
      icon: ListFilter,
      run: () => {
        onFilterChange('all');
        onClose();
      },
    },
    {
      id: 'reset',
      label: 'Reset to sample tasks',
      icon: RotateCcw,
      run: () => {
        onResetSample();
        onClose();
      },
    },
  ];

  const filteredActions = ACTIONS.filter(a =>
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.16, ease: 'easeOut' }}
            className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 gap-2.5">
              <Command className="w-4 h-4 text-zinc-400 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or action..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-transparent text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
              <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                ESC
              </kbd>
            </div>

            {/* Actions List */}
            <div className="p-2 max-h-72 overflow-y-auto space-y-1">
              {filteredActions.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-400">
                  No matching commands found
                </div>
              ) : (
                filteredActions.map(action => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      onClick={action.run}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-left cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 text-zinc-500">
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span>{action.label}</span>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer Bar */}
            <div className="px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex items-center justify-between text-[11px] text-zinc-400 font-mono">
              <span>Navigation: Click or Enter</span>
              <span>⌘K to toggle</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

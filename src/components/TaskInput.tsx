import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Clock, 
  X, 
  CornerDownLeft, 
  Sparkles, 
  Brain, 
  Settings2, 
  Loader2, 
  CheckCircle2,
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';
import type { Priority, Category } from '../types/todo';
import { parseTasksFromText, type ParsedTask } from '../services/aiParser';
import { cn } from '../lib/utils';

interface TaskInputProps {
  onAdd: (title: string, estimatedTime?: string, priority?: Priority, category?: Category) => void;
  onAddBatch?: (tasks: ParsedTask[]) => void;
  onOpenAISettings?: () => void;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const TIME_PRESETS = ['5m', '15m', '30m', '45m', '1h'];
const CATEGORIES: Category[] = ['Work', 'Personal', 'Design', 'Urgent', 'General'];
const PRIORITIES: { value: Priority; label: string; dot: string }[] = [
  { value: 'low', label: 'Low', dot: 'bg-emerald-500' },
  { value: 'medium', label: 'Medium', dot: 'bg-amber-500' },
  { value: 'high', label: 'High', dot: 'bg-rose-500' },
];

export const TaskInput = React.memo(function TaskInput({
  onAdd,
  onAddBatch,
  onOpenAISettings,
  isOpen: controlledOpen,
  onOpenChange,
}: TaskInputProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  
  const setOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalOpen(open);
    }
  };

  // Mode: single task vs AI brain dump
  const [inputMode, setInputMode] = useState<'single' | 'ai'>('single');

  // Single task state
  const [title, setTitle] = useState('');
  const [selectedTime, setSelectedTime] = useState<string>('15m');
  const [customTime, setCustomTime] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority>('medium');
  const [selectedCategory, setSelectedCategory] = useState<Category>('Work');
  const inputRef = useRef<HTMLInputElement>(null);

  // AI brain dump state
  const [brainDumpText, setBrainDumpText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<ParsedTask[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputMode === 'single') {
          inputRef.current?.focus();
        } else {
          textareaRef.current?.focus();
        }
      }, 30);
    }
  }, [isOpen, inputMode]);

  const handleSingleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    // Sanitize title against script injection and cap length
    const cleanTitle = title.replace(/<[^>]*>/g, '').trim().slice(0, 150);
    if (!cleanTitle) return;

    const time = (customTime.replace(/<[^>]*>/g, '').trim() || selectedTime).slice(0, 20);
    onAdd(cleanTitle, time, selectedPriority, selectedCategory);
    setTitle('');
    setCustomTime('');
  };

  const handleAISubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!brainDumpText.trim() || isParsing) return;

    setIsParsing(true);
    setExtractedTasks(null);
    setParseError(null);

    try {
      const results = await parseTasksFromText(brainDumpText);
      if (results.length > 0) {
        if (onAddBatch) {
          onAddBatch(results);
        } else {
          results.forEach(t => onAdd(t.title, t.estimatedTime, t.priority, t.category));
        }
        setExtractedTasks(results);
        setTimeout(() => {
          setBrainDumpText('');
          setExtractedTasks(null);
          setOpen(false);
        }, 1200);
      } else {
        setParseError('No discrete tasks detected in the input. Please provide more descriptive text.');
      }
    } catch {
      setParseError('Failed to extract tasks. Please verify your settings or network connection.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <div className="flex items-center gap-2">
            {/* Collapsed Add Button */}
            <button
              key="collapsed-button"
              type="button"
              onClick={() => {
                setInputMode('single');
                setOpen(true);
              }}
              className={cn(
                "flex-1 flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer",
                "bg-white dark:bg-zinc-900/60",
                "border-dashed border-zinc-300 dark:border-zinc-800",
                "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200",
                "hover:border-zinc-400 dark:hover:border-zinc-700 transition-colors duration-150 group"
              )}
            >
              <div className="flex items-center gap-2.5 text-sm font-medium">
                <div className="w-5 h-5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-zinc-900 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-900 transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
                <span>Add a new task...</span>
              </div>
              <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-medium text-zinc-400 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700">
                Enter
              </kbd>
            </button>

            {/* Direct Quick AI Brain Dump Button */}
            <button
              type="button"
              onClick={() => {
                setInputMode('ai');
                setOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-xs font-medium cursor-pointer shadow-xs"
              title="Parse paragraphs or meeting notes with AI"
            >
              <Brain className="w-4 h-4 text-blue-500" />
              <span className="hidden sm:inline">AI Import</span>
            </button>
          </div>
        ) : (
          <motion.div
            key="expanded-form"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              "p-4 rounded-2xl border shadow-lg space-y-3.5",
              "bg-white dark:bg-zinc-900",
              "border-zinc-200 dark:border-zinc-800"
            )}
          >
            {/* Top Mode Switcher Bar */}
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
              <div className="flex items-center gap-1 p-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('single')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                    inputMode === 'single'
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                  )}
                >
                  <Plus className="w-3 h-3" />
                  <span>Single Task</span>
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('ai')}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                    inputMode === 'ai'
                      ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs"
                      : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400"
                  )}
                >
                  <Brain className="w-3 h-3 text-blue-500" />
                  <span>AI Brain Dump</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {inputMode === 'ai' && onOpenAISettings && (
                  <button
                    type="button"
                    onClick={onOpenAISettings}
                    className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
                    title="AI Provider & Key Settings"
                  >
                    <Settings2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode 1: Single Task Entry */}
            {inputMode === 'single' ? (
              <form onSubmit={handleSingleSubmit} className="space-y-3">
                <div className="relative flex items-center">
                  <input
                    ref={inputRef}
                    type="text"
                    maxLength={150}
                    placeholder="What needs to be done? (max 150 chars)"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full bg-transparent text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 outline-none"
                  />
                </div>

                {/* Time Estimate Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                  <span className="text-[11px] font-medium text-zinc-400 flex items-center gap-1 mr-1">
                    <Clock className="w-3 h-3" /> Time:
                  </span>
                  {TIME_PRESETS.map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setSelectedTime(preset);
                        setCustomTime('');
                      }}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-md font-mono transition-colors cursor-pointer",
                        selectedTime === preset && !customTime
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold shadow-xs"
                          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Custom (e.g. 2h)"
                    value={customTime}
                    onChange={e => setCustomTime(e.target.value)}
                    className="text-xs px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 w-24 outline-none border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700"
                  />
                </div>

                {/* Priority & Category */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-medium text-zinc-400">Priority:</span>
                    {PRIORITIES.map(p => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => setSelectedPriority(p.value)}
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors text-[11px] cursor-pointer",
                          selectedPriority === p.value
                            ? "bg-zinc-200/80 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-medium"
                            : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
                        )}
                      >
                        <span className={cn("w-1.5 h-1.5 rounded-full", p.dot)} />
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <select
                      value={selectedCategory}
                      onChange={e => setSelectedCategory(e.target.value as Category)}
                      className="text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 outline-none cursor-pointer"
                    >
                      {CATEGORIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer",
                      title.trim()
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                        : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                    )}
                  >
                    <span>Add Task</span>
                    <CornerDownLeft className="w-3 h-3" />
                  </button>
                </div>
              </form>
            ) : (
              /* Mode 2: AI Brain Dump & Paragraph Ingestion */
              <form onSubmit={handleAISubmit} className="space-y-3">
                <div className="space-y-1">
                  <textarea
                    ref={textareaRef}
                    rows={4}
                    maxLength={4000}
                    placeholder="Paste a long paragraph, messy notes, or meeting minutes... e.g. 'We urgently need to fix the auth API bug (1h), prepare slides for client by tomorrow (2h), and call dentist to reschedule appointment (15m)'"
                    value={brainDumpText}
                    onChange={e => {
                      setBrainDumpText(e.target.value);
                      if (parseError) setParseError(null);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleAISubmit();
                      }
                    }}
                    className="w-full text-xs leading-relaxed p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700/80 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 transition-colors resize-none"
                  />
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 px-0.5">
                    <span>Press Ctrl+Enter or Cmd+Enter to extract</span>
                    <span className={cn(
                      brainDumpText.length > 3800 ? "text-amber-500 font-medium" : "text-zinc-400"
                    )}>
                      {brainDumpText.length}/4000 chars ({brainDumpText.split(/\s+/).filter(Boolean).length} words)
                    </span>
                  </div>
                </div>

                {/* Error Indicator */}
                {parseError && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{parseError}</span>
                  </div>
                )}

                {/* Status Indicator */}
                {extractedTasks && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Successfully extracted {extractedTasks.length} tasks and auto-sorted by urgency!</span>
                  </div>
                )}

                {/* Bottom Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/60">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-500">
                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                    <span>Auto-assigns domains, durations & urgency</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!brainDumpText.trim() || isParsing}
                      className={cn(
                        "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors shadow-xs cursor-pointer",
                        brainDumpText.trim() && !isParsing
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                      )}
                    >
                      {isParsing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Extract & Auto-Sort</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import {
  GripVertical,
  Check,
  Trash2,
  Clock,
  Plus,
  Flame,
  Briefcase,
  Palette,
  User,
  Folder,
  RotateCcw,
  Maximize2,
  Grid
} from 'lucide-react';
import type { Todo, Priority, Category } from '../types/todo';
import { cn } from '../lib/utils';

interface WidgetGridProps {
  todos: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddQuick: (title: string, category: Category) => void;
}

const CATEGORY_META: Record<string, { label: string; icon: typeof Briefcase; color: string; border: string }> = {
  Work: {
    label: 'Work & Execution',
    icon: Briefcase,
    color: 'text-blue-500 bg-blue-500/10',
    border: 'border-blue-500/20',
  },
  Design: {
    label: 'Design & Creative',
    icon: Palette,
    color: 'text-purple-500 bg-purple-500/10',
    border: 'border-purple-500/20',
  },
  Personal: {
    label: 'Personal & Health',
    icon: User,
    color: 'text-emerald-500 bg-emerald-500/10',
    border: 'border-emerald-500/20',
  },
  Urgent: {
    label: 'Urgent & Critical',
    icon: Flame,
    color: 'text-rose-500 bg-rose-500/10',
    border: 'border-rose-500/20',
  },
  General: {
    label: 'General Tasks',
    icon: Folder,
    color: 'text-zinc-500 bg-zinc-500/10',
    border: 'border-zinc-500/20',
  },
};

const PRIORITY_DOTS: Record<Priority, string> = {
  high: 'bg-rose-500 shadow-rose-500/50',
  medium: 'bg-amber-500 shadow-amber-500/50',
  low: 'bg-emerald-500 shadow-emerald-500/50',
};

// Bento Category Widget Card
function BentoCategoryWidget({
  category,
  tasks,
  onToggle,
  onDelete,
  onAddQuick,
  onHeaderPointerDown,
  isDragging = false,
}: {
  category: Category;
  tasks: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddQuick: (title: string, category: Category) => void;
  onHeaderPointerDown?: (e: React.PointerEvent) => void;
  isDragging?: boolean;
}) {
  const [quickInput, setQuickInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const meta = CATEGORY_META[category] || CATEGORY_META.General;
  const Icon = meta.icon;

  // Auto-sort tasks by urgency (high -> medium -> low), with completed at bottom
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const weights: Record<Priority, number> = { high: 3, medium: 2, low: 1 };
    return weights[b.priority] - weights[a.priority];
  });

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickInput.trim()) {
      onAddQuick(quickInput.trim(), category);
      setQuickInput('');
      setIsAdding(false);
    }
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <div
      className={cn(
        "rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-4 space-y-3.5 shadow-xs select-none flex flex-col justify-between transition-colors",
        isDragging
          ? "ring-2 ring-blue-500/50 shadow-2xl cursor-grabbing scale-[1.02]"
          : "hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      {/* Widget Header - Drag handle */}
      <div
        onPointerDown={onHeaderPointerDown}
        className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3 cursor-grab active:cursor-grabbing touch-none select-none"
        title="Drag widget to re-tile grid"
      >
        <div className="flex items-center gap-2.5 pointer-events-none">
          <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", meta.color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight">
              {meta.label}
            </h4>
            <span className="text-[10px] text-zinc-400 font-mono">
              {completedCount}/{tasks.length} done
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1" onPointerDown={e => e.stopPropagation()}>
          {/* Quick Add toggle */}
          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md transition-colors cursor-pointer"
            title="Add task to this widget"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {/* Grip Icon */}
          <div
            onPointerDown={onHeaderPointerDown}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-grab active:cursor-grabbing rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-none"
            title="Drag to reorder grid"
          >
            <GripVertical className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Quick Add Input Bar */}
      {isAdding && (
        <form onSubmit={handleQuickSubmit} className="flex items-center gap-1.5 pt-0.5">
          <input
            type="text"
            placeholder={`Add to ${category}...`}
            value={quickInput}
            onChange={e => setQuickInput(e.target.value)}
            autoFocus
            className="flex-1 text-xs px-2.5 py-1 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 outline-none"
          />
          <button
            type="submit"
            disabled={!quickInput.trim()}
            className="px-2 py-1 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-lg font-medium cursor-pointer disabled:opacity-40 hover:opacity-90"
          >
            Add
          </button>
        </form>
      )}

      {/* Tasks Mini List */}
      <div className="space-y-1.5 flex-1 min-h-[90px]">
        {sortedTasks.length === 0 ? (
          <div className="h-full flex items-center justify-center py-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No tasks in this domain
          </div>
        ) : (
          sortedTasks.map(task => (
            <div
              key={task.id}
              className={cn(
                "group flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-xs border transition-colors",
                "bg-zinc-50/70 dark:bg-zinc-850/60 border-zinc-200/70 dark:border-zinc-800/60",
                "hover:border-zinc-300 dark:hover:border-zinc-700",
                task.completed && "opacity-50"
              )}
            >
              {/* Checkbox & Title */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => onToggle(task.id)}
                  className={cn(
                    "w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors cursor-pointer",
                    task.completed
                      ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-950"
                      : "border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800"
                  )}
                >
                  {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                </button>
                <span className={cn(
                  "truncate",
                  task.completed ? "line-through text-zinc-400 dark:text-zinc-500" : "text-zinc-800 dark:text-zinc-200"
                )}>
                  {task.title}
                </span>
              </div>

              {/* Right Badges */}
              <div className="flex items-center gap-1.5 shrink-0">
                {task.estimatedTime && (
                  <span className="flex items-center gap-0.5 text-[10px] font-mono px-1 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                    <Clock className="w-2.5 h-2.5 opacity-60" />
                    {task.estimatedTime}
                  </span>
                )}
                <div
                  className={cn("w-1.5 h-1.5 rounded-full", PRIORITY_DOTS[task.priority])}
                  title={`Priority: ${task.priority}`}
                />
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-500 transition-opacity p-0.5 cursor-pointer"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const WidgetGrid = React.memo(function WidgetGrid({
  todos,
  onToggle,
  onDelete,
  onAddQuick,
}: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<Category, HTMLDivElement>>(new Map());

  // Default and active categories
  const DEFAULT_CATEGORIES: Category[] = ['Work', 'Design', 'Personal', 'Urgent', 'General'];

  const [categories, setCategories] = useState<Category[]>(() => {
    const used = Array.from(new Set(todos.map(t => t.category))) as Category[];
    return Array.from(new Set([...used, ...DEFAULT_CATEGORIES])) as Category[];
  });

  // Dragging & Snapping State
  const [dragState, setDragState] = useState<{
    category: Category;
    dimensions: { width: number; height: number };
    grabOffset: { x: number; y: number };
    pointer: { x: number; y: number };
    targetIndex: number;
    isDropping?: boolean;
    dropTargetPos?: { x: number; y: number };
  } | null>(null);

  const categoriesRef = useRef(categories);
  categoriesRef.current = categories;

  const lastSwapTime = useRef<number>(0);

  // Live Dynamic Hover Reorder with Preserved Shared-Container FLIP Animation
  const handleStartDrag = useCallback((e: React.PointerEvent, cat: Category, fromIndex: number) => {
    if ((e.target as HTMLElement).closest('button, input, form')) return;
    e.preventDefault();

    const cardEl = cardRefs.current.get(cat);
    if (!cardEl) return;

    const rect = cardEl.getBoundingClientRect();
    const grabOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    const dimensions = {
      width: rect.width,
      height: rect.height,
    };

    // Calculate static row & column boundaries before any cards move
    const currentCats = categoriesRef.current;
    const cols = window.innerWidth >= 768 ? 2 : 1;
    const numRows = Math.ceil(currentCats.length / cols);

    const rowBoundaries: { top: number; bottom: number }[] = [];
    for (let r = 0; r < numRows; r++) {
      const idx1 = r * cols;
      const idx2 = Math.min(currentCats.length - 1, r * cols + (cols - 1));
      const el1 = cardRefs.current.get(currentCats[idx1]);
      const el2 = cardRefs.current.get(currentCats[idx2]);
      const r1 = el1?.getBoundingClientRect();
      const r2 = el2?.getBoundingClientRect();

      const top = Math.min(r1?.top ?? rect.top, r2?.top ?? rect.top);
      const bottom = Math.max(r1?.bottom ?? rect.bottom, r2?.bottom ?? rect.bottom);
      rowBoundaries.push({ top, bottom });
    }

    const gridRect = gridRef.current?.getBoundingClientRect() || rect;
    const colMidX = gridRect.left + gridRect.width / 2;

    let hasStarted = false;
    const startX = e.clientX;
    const startY = e.clientY;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      // Start drag after 4px threshold
      if (!hasStarted && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        hasStarted = true;
        setDragState({
          category: cat,
          dimensions,
          grabOffset,
          pointer: { x: moveEvt.clientX, y: moveEvt.clientY },
          targetIndex: fromIndex,
        });
      }

      if (hasStarted) {
        setDragState(prev => prev ? {
          ...prev,
          pointer: { x: moveEvt.clientX, y: moveEvt.clientY },
        } : null);

        // Calculate target slot geometrically with 90ms debounce
        const now = Date.now();
        if (now - lastSwapTime.current > 90) {
          // Column index
          const targetCol = (cols === 2 && moveEvt.clientX >= colMidX) ? 1 : 0;

          // Row index: find closest row center
          let bestRow = 0;
          let minRowDist = Infinity;
          rowBoundaries.forEach((rb, r) => {
            const rowCenterY = (rb.top + rb.bottom) / 2;
            const dist = Math.abs(moveEvt.clientY - rowCenterY);
            if (dist < minRowDist) {
              minRowDist = dist;
              bestRow = r;
            }
          });

          const targetIdx = Math.min(categoriesRef.current.length - 1, Math.max(0, bestRow * cols + targetCol));
          const currentCatIdx = categoriesRef.current.indexOf(cat);

          if (currentCatIdx !== -1 && currentCatIdx !== targetIdx) {
            setCategories(prev => {
              const curIdx = prev.indexOf(cat);
              if (curIdx === -1 || curIdx === targetIdx) return prev;
              const next = [...prev];
              const [moved] = next.splice(curIdx, 1);
              next.splice(targetIdx, 0, moved);
              return next;
            });
            setDragState(prev => prev ? { ...prev, targetIndex: targetIdx } : null);
            lastSwapTime.current = Date.now();
          }
        }
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (hasStarted) {
        // Find current card element's target bounding rect for tactile drop snap
        const currentCatEl = cardRefs.current.get(cat);
        if (currentCatEl) {
          const targetRect = currentCatEl.getBoundingClientRect();
          setDragState(prev => prev ? {
            ...prev,
            isDropping: true,
            dropTargetPos: { x: targetRect.left, y: targetRect.top },
          } : null);

          // Clear floating overlay after spring snap finishes
          setTimeout(() => {
            setDragState(null);
          }, 160);
        } else {
          setDragState(null);
        }
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }, []);

  const handleResetGrid = () => {
    const used = Array.from(new Set(todos.map(t => t.category))) as Category[];
    setCategories(Array.from(new Set([...used, ...DEFAULT_CATEGORIES])) as Category[]);
  };

  return (
    <div className="space-y-3">
      {/* Canvas Header & Snap Mode Indicator */}
      <div className="flex items-center justify-between text-xs px-1 select-none">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
            <Grid className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Bento Grid
            </span>
            <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500 text-[11px] ml-1.5">
              (Drag & Snap)
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetGrid}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60 transition-colors cursor-pointer shadow-xs"
          title="Reset widgets back to default grid order"
        >
          <RotateCcw className="w-3 h-3 text-zinc-400" />
          <span>Reset Grid</span>
        </button>
      </div>

      {/* 
        BOUNDED CANVAS CONTAINER BOX:
        Direct-children FLIP animation layout with spring physics.
      */}
      <div
        ref={containerRef}
        className={cn(
          "relative w-full min-h-[580px] rounded-3xl border p-4 sm:p-5 overflow-hidden shadow-xs",
          "border-zinc-200/90 dark:border-zinc-800/90",
          "bg-zinc-50/50 dark:bg-zinc-950/40",
          // Refined dot grid canvas
          "[background-image:radial-gradient(rgba(120,120,120,0.12)_1px,transparent_1px)] [background-size:18px_18px]"
        )}
      >
        {/* Subtle Watermark Tag */}
        <div className="absolute top-3 right-4 pointer-events-none flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-zinc-400/50 dark:text-zinc-600/60 select-none">
          <Maximize2 className="w-2.5 h-2.5" />
          <span>Widgets</span>
        </div>

        {/* 
          2-Column Responsive Bento Grid:
          Every card is a DIRECT sibling inside the grid with layout={true},
          ensuring Framer Motion animates their movement smoothly across slots!
        */}
        <div
          ref={gridRef}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 relative w-full h-full"
        >
          {categories.map((cat, index) => {
            const isPlaceholder = dragState?.category === cat;
            const meta = CATEGORY_META[cat] || CATEGORY_META.General;
            const Icon = meta.icon;

            return (
              <motion.div
                key={cat}
                layout
                transition={{
                  type: 'spring',
                  damping: 26,
                  stiffness: 320,
                  mass: 0.8,
                }}
                ref={el => {
                  if (el) cardRefs.current.set(cat, el);
                  else cardRefs.current.delete(cat);
                }}
                className="relative w-full"
              >
                {isPlaceholder ? (
                  // Height-matched placeholder slot that slides along with the layout!
                  <div
                    style={{
                      height: dragState?.dimensions.height || 220,
                    }}
                    className="w-full rounded-2xl border-2 border-dashed border-zinc-300 dark:border-zinc-700/80 bg-zinc-100/40 dark:bg-zinc-800/20 p-5 flex flex-col items-center justify-center space-y-2 select-none opacity-60 transition-colors"
                  >
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", meta.color)}>
                      <Icon className="w-4 h-4 opacity-70" />
                    </div>
                    <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      {meta.label}
                    </span>
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      Slot {index + 1}
                    </span>
                  </div>
                ) : (
                  // Static Widget Card
                  <BentoCategoryWidget
                    category={cat}
                    tasks={todos.filter(t => t.category === cat)}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onAddQuick={onAddQuick}
                    onHeaderPointerDown={e => handleStartDrag(e, cat, index)}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 
        FLOATING DRAGGED CARD WITH SPRING DROP SNAP
        Renders smoothly under the pointer, and springs right into the target slot on release.
      */}
      {dragState && (
        <motion.div
          style={{
            position: 'fixed',
            width: dragState.dimensions.width,
            zIndex: 9999,
            pointerEvents: 'none',
          }}
          animate={
            dragState.isDropping && dragState.dropTargetPos
              ? {
                left: dragState.dropTargetPos.x,
                top: dragState.dropTargetPos.y,
                scale: 1,
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }
              : {
                left: dragState.pointer.x - dragState.grabOffset.x,
                top: dragState.pointer.y - dragState.grabOffset.y,
                scale: 1.03,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              }
          }
          transition={
            dragState.isDropping
              ? { type: 'spring', damping: 26, stiffness: 420 }
              : { duration: 0 }
          }
          className="rounded-2xl ring-2 ring-blue-500/50"
        >
          <BentoCategoryWidget
            category={dragState.category}
            tasks={todos.filter(t => t.category === dragState.category)}
            onToggle={() => { }}
            onDelete={() => { }}
            onAddQuick={() => { }}
            isDragging
          />
        </motion.div>
      )}
    </div>
  );
});

import React, { useState, useRef, useCallback } from 'react';
import { motion, useMotionValue, animate, useDragControls, type PanInfo } from 'motion/react';
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
  Layers,
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

// Single 2D Free-Draggable Widget Card that Snaps to Grid Slots on Release
function BentoCategoryWidget({
  category,
  index,
  tasks,
  onToggle,
  onDelete,
  onAddQuick,
  constraintsRef,
  onDropToSlot,
}: {
  category: Category;
  index: number;
  tasks: Todo[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddQuick: (title: string, category: Category) => void;
  constraintsRef: React.RefObject<HTMLDivElement | null>;
  onDropToSlot: (fromIndex: number, offset: { x: number; y: number }) => void;
}) {
  const dragControls = useDragControls();
  const [quickInput, setQuickInput] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Motion values for smooth X/Y 2D tracking and spring snap
  const x = useMotionValue(0);
  const y = useMotionValue(0);

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

  const handleDragEnd = (_e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    // Notify parent to swap or reorder slots based on drop position
    onDropToSlot(index, info.offset);

    // Magnetic spring snap back to center (relative 0,0 of target slot)
    animate(x, 0, { type: 'spring', damping: 28, stiffness: 400 });
    animate(y, 0, { type: 'spring', damping: 28, stiffness: 400 });
  };

  const completedCount = tasks.filter(t => t.completed).length;

  return (
    <motion.div
      layout="position"
      style={{ x, y }}
      drag
      dragConstraints={constraintsRef}
      dragElastic={0.06}
      dragMomentum={false}
      dragListener={false}
      dragControls={dragControls}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      whileDrag={{
        scale: 1.03,
        zIndex: 50,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)',
      }}
      className={cn(
        "rounded-2xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 p-4 space-y-3.5 shadow-xs select-none flex flex-col justify-between transition-colors",
        isDragging ? "ring-2 ring-blue-500/50 cursor-grabbing" : "hover:border-zinc-300 dark:hover:border-zinc-700"
      )}
    >
      {/* Widget Header - Free 2D drag handle */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3 cursor-grab active:cursor-grabbing touch-none select-none"
        title="Drag widget in 2D to snap into another slot"
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
            onPointerDown={(e) => dragControls.start(e)}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-1 cursor-grab active:cursor-grabbing rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors touch-none"
            title="Drag &amp; snap to grid"
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
            className="px-2 py-1 text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-lg font-medium cursor-pointer disabled:opacity-40"
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
    </motion.div>
  );
}

export const WidgetGrid = React.memo(function WidgetGrid({
  todos,
  onToggle,
  onDelete,
  onAddQuick,
}: WidgetGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Default and active categories
  const DEFAULT_CATEGORIES: Category[] = ['Work', 'Design', 'Personal', 'Urgent', 'General'];
  
  const [categories, setCategories] = useState<Category[]>(() => {
    const used = Array.from(new Set(todos.map(t => t.category))) as Category[];
    return Array.from(new Set([...used, ...DEFAULT_CATEGORIES])) as Category[];
  });

  // Calculate closest grid slot and swap positions
  const handleDropToSlot = useCallback((fromIndex: number, offset: { x: number; y: number }) => {
    const fromEl = slotRefs.current.get(fromIndex);
    if (!fromEl) return;

    const fromRect = fromEl.getBoundingClientRect();
    const draggedCenterX = fromRect.left + fromRect.width / 2 + offset.x;
    const draggedCenterY = fromRect.top + fromRect.height / 2 + offset.y;

    let closestIndex = fromIndex;
    let minDistanceSq = Infinity;

    // Check all slot anchor positions
    slotRefs.current.forEach((el, idx) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distSq = (draggedCenterX - cx) ** 2 + (draggedCenterY - cy) ** 2;
      if (distSq < minDistanceSq) {
        minDistanceSq = distSq;
        closestIndex = idx;
      }
    });

    // If dragged to a different slot, swap them in state!
    if (closestIndex !== fromIndex) {
      setCategories(prev => {
        const next = [...prev];
        const [movedItem] = next.splice(fromIndex, 1);
        next.splice(closestIndex, 0, movedItem);
        return next;
      });
    }
  }, []);

  const handleResetGrid = () => {
    const used = Array.from(new Set(todos.map(t => t.category))) as Category[];
    setCategories(Array.from(new Set([...used, ...DEFAULT_CATEGORIES])) as Category[]);
  };

  return (
    <div className="space-y-3">
      {/* Canvas Header & Snap Mode Indicator */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-blue-500/10 text-blue-500">
            <Grid className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">
              Grid Bento Dashboard
            </span>
            <span className="hidden sm:inline text-zinc-400 dark:text-zinc-500 text-[11px] ml-1.5">
              (2D Free Drag with Magnetic Slot Snapping)
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
        Confines widgets inside containerRef so they NEVER escape or glitch off-screen.
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
          <span>Magnetic Snap Canvas</span>
        </div>

        {/* 2-Column Responsive Bento Grid Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative w-full h-full">
          {categories.map((cat, index) => (
            <div
              key={cat}
              ref={el => {
                if (el) slotRefs.current.set(index, el);
                else slotRefs.current.delete(index);
              }}
              className="relative w-full"
            >
              <BentoCategoryWidget
                category={cat}
                index={index}
                tasks={todos.filter(t => t.category === cat)}
                onToggle={onToggle}
                onDelete={onDelete}
                onAddQuick={onAddQuick}
                constraintsRef={containerRef}
                onDropToSlot={handleDropToSlot}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

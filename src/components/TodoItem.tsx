import React, { useState, useRef, useEffect } from 'react';
import { motion, Reorder, useDragControls } from 'motion/react';
import { 
  GripVertical, 
  Check, 
  Trash2, 
  Clock, 
  Edit3, 
  X,
  Flame,
  AlertCircle
} from 'lucide-react';
import type { Todo, Priority } from '../types/todo';
import { cn } from '../lib/utils';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, updates: Partial<Todo>) => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; dotClass: string; badgeClass: string; icon: typeof AlertCircle }> = {
  high: {
    label: 'High',
    dotClass: 'bg-rose-500 shadow-rose-500/50',
    badgeClass: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    icon: Flame,
  },
  medium: {
    label: 'Med',
    dotClass: 'bg-amber-500 shadow-amber-500/50',
    badgeClass: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
    icon: AlertCircle,
  },
  low: {
    label: 'Low',
    dotClass: 'bg-emerald-500 shadow-emerald-500/50',
    badgeClass: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    icon: Clock,
  },
};

const CATEGORY_STYLES: Record<string, string> = {
  Work: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
  Personal: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Design: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/20',
  Urgent: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
  General: 'text-zinc-600 dark:text-zinc-400 bg-zinc-500/10 border-zinc-500/20',
};

export const TodoItem = React.memo(function TodoItem({ todo, onToggle, onDelete, onEdit }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editTime, setEditTime] = useState(todo.estimatedTime || '');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Custom drag controls to restrict drag initiation to the grip handle only (@ddoemonn pattern)
  const dragControls = useDragControls();

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (editTitle.trim()) {
      onEdit(todo.id, {
        title: editTitle.trim(),
        estimatedTime: editTime.trim() || undefined,
      });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setEditTime(todo.estimatedTime || '');
      setIsEditing(false);
    }
  };

  const priorityInfo = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG.medium;
  const categoryStyle = CATEGORY_STYLES[todo.category] || CATEGORY_STYLES.General;

  return (
    <Reorder.Item
      value={todo}
      id={todo.id}
      dragListener={false}
      dragControls={dragControls}
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.16, ease: 'easeOut' }
      }}
      exit={{ 
        opacity: 0, 
        x: -16, 
        transition: { duration: 0.14, ease: 'easeIn' } 
      }}
      whileDrag={{ 
        boxShadow: '0 16px 32px -8px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.12)',
        zIndex: 50,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group relative flex items-center gap-3 px-3.5 py-3 rounded-xl border select-none",
        // Solid high-performance background without expensive GPU backdrop-blur
        "bg-white dark:bg-zinc-900",
        "border-zinc-200/90 dark:border-zinc-800/80",
        "hover:border-zinc-300 dark:hover:border-zinc-700/90 hover:bg-zinc-50 dark:hover:bg-zinc-850",
        "shadow-xs",
        todo.completed && "opacity-60 bg-zinc-100/60 dark:bg-zinc-900/40"
      )}
    >
      {/* Drag Grip Handle (@ddoemonn style) */}
      <div 
        onPointerDown={(e) => dragControls.start(e)}
        className="text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-grab active:cursor-grabbing p-1.5 -ml-2 transition-colors touch-none select-none rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
        title="Drag to reorder"
      >
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Animated Checkbox (@uniquesonu style) */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle(todo.id);
        }}
        aria-label={todo.completed ? "Mark task active" : "Mark task completed"}
        className={cn(
          "relative flex items-center justify-center w-5 h-5 rounded-md border shrink-0 transition-colors duration-150 cursor-pointer",
          todo.completed
            ? "bg-zinc-900 dark:bg-zinc-100 border-zinc-900 dark:border-zinc-100 text-white dark:text-zinc-950 shadow-xs"
            : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-500 dark:hover:border-zinc-500 bg-zinc-50 dark:bg-zinc-800/60"
        )}
      >
        {todo.completed && (
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        )}
      </button>

      {/* Content & Inline Edit Area (@0xUrvish style) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {isEditing ? (
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={e => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <input
              type="text"
              placeholder="15m"
              value={editTime}
              onChange={e => setEditTime(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-16 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 px-2 py-0.5 rounded border border-zinc-300 dark:border-zinc-700 outline-none"
            />
            <button
              type="button"
              onClick={handleSave}
              className="p-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 rounded cursor-pointer"
              title="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="p-1 text-zinc-400 hover:text-zinc-600 rounded cursor-pointer"
              title="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <span
              onDoubleClick={() => !todo.completed && setIsEditing(true)}
              className={cn(
                "text-sm font-normal tracking-tight truncate transition-colors duration-150 cursor-text select-text",
                todo.completed
                  ? "line-through text-zinc-400 dark:text-zinc-500"
                  : "text-zinc-800 dark:text-zinc-200"
              )}
            >
              {todo.title}
            </span>

            {/* Badges: Time, Priority dot, Category */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Category Pill */}
              {todo.category && (
                <span className={cn("text-[10px] font-medium px-1.5 py-0.5 rounded-md border tracking-wide", categoryStyle)}>
                  {todo.category}
                </span>
              )}

              {/* Time Estimate Badge */}
              {todo.estimatedTime && (
                <span className="flex items-center gap-1 text-[11px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/80">
                  <Clock className="w-2.5 h-2.5 opacity-60" />
                  {todo.estimatedTime}
                </span>
              )}

              {/* Priority Micro-dot Indicator */}
              <div 
                className={cn("w-1.5 h-1.5 rounded-full shadow-xs ml-0.5", priorityInfo.dotClass)}
                title={`Priority: ${priorityInfo.label}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons (Slide-in on hover) */}
      <div className={cn(
        "flex items-center gap-1 shrink-0 transition-opacity duration-150",
        isHovered && !isEditing ? "opacity-100" : "opacity-0 md:opacity-0 group-hover:opacity-100"
      )}>
        {!todo.completed && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            aria-label="Edit task"
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(todo.id);
          }}
          aria-label="Delete task"
          className="p-1 rounded-md text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </Reorder.Item>
  );
}, (prev, next) => {
  return (
    prev.todo.id === next.todo.id &&
    prev.todo.title === next.todo.title &&
    prev.todo.completed === next.todo.completed &&
    prev.todo.estimatedTime === next.todo.estimatedTime &&
    prev.todo.priority === next.todo.priority &&
    prev.todo.category === next.todo.category &&
    prev.onToggle === next.onToggle &&
    prev.onDelete === next.onDelete &&
    prev.onEdit === next.onEdit
  );
});

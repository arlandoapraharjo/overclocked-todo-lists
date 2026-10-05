import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Todo, Priority, Category, FilterStatus, TodoStats } from '../types/todo';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'focusflow_todos_v1';

const INITIAL_TODOS: Todo[] = [
  {
    id: 'task-1',
    title: 'Review quarterly product design sprint with team',
    completed: false,
    estimatedTime: '45m',
    priority: 'high',
    category: 'Work',
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'task-2',
    title: 'Integrate 21st.dev drag & drop motion interactions',
    completed: false,
    estimatedTime: '20m',
    priority: 'high',
    category: 'Design',
    createdAt: Date.now() - 2400000,
  },
  {
    id: 'task-3',
    title: 'Update Geist font pairings & OLED dark tokens',
    completed: true,
    estimatedTime: '15m',
    priority: 'medium',
    category: 'Design',
    createdAt: Date.now() - 1800000,
    completedAt: Date.now() - 600000,
  },
  {
    id: 'task-4',
    title: 'Daily meditation & 15-minute hydration break',
    completed: false,
    estimatedTime: '15m',
    priority: 'low',
    category: 'Personal',
    createdAt: Date.now() - 1200000,
  },
  {
    id: 'task-5',
    title: 'Deploy micro-animation test build to staging',
    completed: false,
    estimatedTime: '1h',
    priority: 'medium',
    category: 'Work',
    createdAt: Date.now() - 600000,
  },
];

export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load tasks from localStorage', e);
    }
    return INITIAL_TODOS;
  });

  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persist to localStorage with debounce to preserve 60fps frame rates
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
      } catch (e) {
        console.error('Failed to save tasks to localStorage', e);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [todos]);

  // Lightweight non-blocking confetti
  const triggerConfetti = useCallback(() => {
    try {
      const confettiFn = typeof confetti === 'function' ? confetti : (confetti as unknown as { default: typeof confetti })?.default;
      if (typeof confettiFn === 'function') {
        confettiFn({
          particleCount: 20,
          spread: 45,
          ticks: 70,
          scalar: 0.7,
          origin: { y: 0.8 },
          colors: ['#38bdf8', '#818cf8', '#c084fc', '#34d399', '#f472b6'],
          disableForReducedMotion: true,
        });
      }
    } catch (_) {}
  }, []);

  const addTodo = useCallback((
    title: string,
    estimatedTime?: string,
    priority: Priority = 'medium',
    category: Category = 'General'
  ) => {
    if (!title.trim()) return;

    const newTodo: Todo = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: title.trim(),
      completed: false,
      estimatedTime: estimatedTime?.trim() || undefined,
      priority,
      category,
      createdAt: Date.now(),
    };

    setTodos(prev => [newTodo, ...prev]);
  }, []);

  const addBatchTodos = useCallback((parsedTasks: { title: string; estimatedTime?: string; priority: Priority; category: Category }[]) => {
    if (!parsedTasks.length) return;
    const newItems: Todo[] = parsedTasks.map((t, idx) => ({
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      title: t.title.trim(),
      completed: false,
      estimatedTime: t.estimatedTime?.trim() || undefined,
      priority: t.priority,
      category: t.category,
      createdAt: Date.now() - idx * 1000,
    }));
    setTodos(prev => [...newItems, ...prev]);
  }, []);

  const toggleComplete = useCallback((id: string) => {
    setTodos(prev => {
      const item = prev.find(t => t.id === id);
      const willBeCompleted = !item?.completed;
      if (willBeCompleted) {
        triggerConfetti();
      }
      return prev.map(t =>
        t.id === id
          ? {
              ...t,
              completed: !t.completed,
              completedAt: !t.completed ? Date.now() : undefined,
            }
          : t
      );
    });
  }, [triggerConfetti]);

  const deleteTodo = useCallback((id: string) => {
    setTodos(prev => prev.filter(t => t.id !== id));
  }, []);

  const editTodo = useCallback((id: string, updates: Partial<Omit<Todo, 'id' | 'createdAt'>>) => {
    setTodos(prev => prev.map(t => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  // Safe reordering that never loses items hidden by filters
  const reorderTodos = useCallback((newFilteredTodos: Todo[]) => {
    setTodos(prev => {
      const isFiltered = filterStatus !== 'all' || selectedCategory !== 'all' || selectedPriority !== 'all' || searchQuery.trim().length > 0;
      if (!isFiltered) {
        return newFilteredTodos;
      }
      const newFilteredIds = new Set(newFilteredTodos.map(t => t.id));
      const nonFiltered = prev.filter(t => !newFilteredIds.has(t.id));
      return [...newFilteredTodos, ...nonFiltered];
    });
  }, [filterStatus, selectedCategory, selectedPriority, searchQuery]);

  const clearCompleted = useCallback(() => {
    setTodos(prev => prev.filter(t => !t.completed));
  }, []);

  const markAllComplete = useCallback(() => {
    setTodos(prev => prev.map(t => ({ ...t, completed: true, completedAt: t.completedAt || Date.now() })));
    triggerConfetti();
  }, [triggerConfetti]);

  const resetToSample = useCallback(() => {
    setTodos(INITIAL_TODOS);
  }, []);

  // Memoized filtered todos
  const filteredTodos = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return todos.filter(todo => {
      if (filterStatus === 'active' && todo.completed) return false;
      if (filterStatus === 'completed' && !todo.completed) return false;
      if (selectedCategory !== 'all' && todo.category !== selectedCategory) return false;
      if (selectedPriority !== 'all' && todo.priority !== selectedPriority) return false;
      if (q) {
        return (
          todo.title.toLowerCase().includes(q) ||
          todo.category.toLowerCase().includes(q) ||
          (todo.estimatedTime && todo.estimatedTime.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [todos, filterStatus, selectedCategory, selectedPriority, searchQuery]);

  // Memoized stats
  const stats: TodoStats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pending, percent };
  }, [todos]);

  return {
    todos,
    filteredTodos,
    stats,
    filterStatus,
    setFilterStatus,
    selectedCategory,
    setSelectedCategory,
    selectedPriority,
    setSelectedPriority,
    searchQuery,
    setSearchQuery,
    addTodo,
    addBatchTodos,
    toggleComplete,
    deleteTodo,
    editTodo,
    reorderTodos,
    clearCompleted,
    markAllComplete,
    resetToSample,
  };
}

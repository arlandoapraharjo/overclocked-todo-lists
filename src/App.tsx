import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence, Reorder, motion } from 'motion/react';
import { useTodos } from './hooks/useTodos';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { TaskInput } from './components/TaskInput';
import { TodoItem } from './components/TodoItem';
import { WidgetGrid } from './components/WidgetGrid';
import { CommandPalette } from './components/CommandPalette';
import { AISettingsModal } from './components/AISettingsModal';
import { Inbox, Plus, RotateCcw, LayoutGrid, List } from 'lucide-react';
import type { Category } from './types/todo';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('focusflow_theme');
      if (stored) return stored === 'dark';
    } catch (_) {}
    return true; // default to dark minimalist
  });

  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try {
      const stored = localStorage.getItem('focusflow_view_mode');
      if (stored === 'grid' || stored === 'list') return stored;
    } catch (_) {}
    return 'list';
  });

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isTaskInputOpen, setIsTaskInputOpen] = useState(false);
  const [isAISettingsOpen, setIsAISettingsOpen] = useState(false);

  const {
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
  } = useTodos();

  // Apply dark class to document root
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      localStorage.setItem('focusflow_theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('focusflow_theme', 'light');
    }
  }, [isDark]);

  // Persist view mode
  useEffect(() => {
    localStorage.setItem('focusflow_view_mode', viewMode);
  }, [viewMode]);

  // Global keyboard shortcuts (⌘K or Ctrl+K for command menu)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setIsDark(prev => !prev);
  }, []);

  const handleOpenCommand = useCallback(() => {
    setIsCommandOpen(true);
  }, []);

  const handleCloseCommand = useCallback(() => {
    setIsCommandOpen(false);
  }, []);

  const handleFocusAdd = useCallback(() => {
    setIsTaskInputOpen(true);
  }, []);

  const handleOpenAISettings = useCallback(() => {
    setIsAISettingsOpen(true);
  }, []);

  const handleQuickAddWidget = useCallback((title: string, category: Category) => {
    addTodo(title, '15m', 'medium', category);
  }, [addTodo]);

  return (
    <div className="relative min-h-screen selection:bg-zinc-800 selection:text-zinc-100 flex flex-col justify-between">
      {/* Main Container - Expands nicely in Grid Mode */}
      <main className={`w-full ${viewMode === 'grid' ? 'max-w-3xl' : 'max-w-xl'} mx-auto px-4 py-8 sm:py-12 flex-1 space-y-6 transition-[max-width] duration-200`}>
        {/* Header & Stats with View Mode & AI triggers */}
        <Header
          stats={stats}
          isDark={isDark}
          onToggleTheme={handleToggleTheme}
          onOpenCommand={handleOpenCommand}
          onOpenAISettings={handleOpenAISettings}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {/* Task Input (Single Task + AI Brain Dump Ingestion) */}
        <TaskInput 
          onAdd={addTodo}
          onAddBatch={addBatchTodos}
          onOpenAISettings={handleOpenAISettings}
          isOpen={isTaskInputOpen}
          onOpenChange={setIsTaskInputOpen}
        />

        {/* Filter & Search Bar */}
        <FilterBar
          status={filterStatus}
          onStatusChange={setFilterStatus}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCount={stats.pending}
          completedCount={stats.completed}
          totalCount={stats.total}
        />

        {/* Smooth Transition between Bento Grid View and Unified List View */}
        <AnimatePresence mode="wait" initial={false}>
          {viewMode === 'grid' ? (
            <motion.div
              key="grid-bento-view"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <WidgetGrid
                todos={filteredTodos}
                onToggle={toggleComplete}
                onDelete={deleteTodo}
                onAddQuick={handleQuickAddWidget}
              />
            </motion.div>
          ) : (
            <motion.div
              key="unified-list-view"
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.99 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-2 pt-1"
            >
              {filteredTodos.length === 0 ? (
                <div className="py-12 px-4 text-center rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/30 space-y-3">
                  <Inbox className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600" />
                  <div>
                    <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {searchQuery
                        ? 'No tasks found matching your search'
                        : filterStatus === 'completed'
                        ? 'No completed tasks yet'
                        : 'All caught up! No active tasks'}
                    </p>
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
                      {searchQuery ? 'Try clearing your search query' : 'Create a new task or use AI Brain Dump'}
                    </p>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleFocusAdd}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-xs cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Task</span>
                    </button>
                    {todos.length === 0 && (
                      <button
                        type="button"
                        onClick={resetToSample}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Sample Tasks</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <Reorder.Group
                  axis="y"
                  values={filteredTodos}
                  onReorder={reorderTodos}
                  className="space-y-2"
                >
                  <AnimatePresence initial={false}>
                    {filteredTodos.map(todo => (
                      <TodoItem
                        key={todo.id}
                        todo={todo}
                        onToggle={toggleComplete}
                        onDelete={deleteTodo}
                        onEdit={editTodo}
                      />
                    ))}
                  </AnimatePresence>
                </Reorder.Group>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom Utility Bar */}
        {todos.length > 0 && (
          <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500 pt-3 border-t border-zinc-100 dark:border-zinc-850 px-1">
            <span>
              {stats.completed} of {stats.total} completed ({stats.percent}%)
            </span>

            <div className="flex items-center gap-3">
              {stats.completed > 0 && (
                <button
                  type="button"
                  onClick={clearCompleted}
                  className="hover:text-rose-500 dark:hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear completed
                </button>
              )}
              {stats.pending > 0 && (
                <button
                  type="button"
                  onClick={markAllComplete}
                  className="hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  Mark all done
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sleek Minimalist Footer */}
      <footer className="w-full text-center py-6 text-[11px] text-zinc-400 dark:text-zinc-600 border-t border-zinc-100 dark:border-zinc-900/60">
        <p className="flex items-center justify-center gap-1.5">
          <span>Crafted with</span>
          <span className="font-semibold text-zinc-700 dark:text-zinc-300">21st.dev</span>
          <span>minimalist design aesthetics</span>
        </p>
      </footer>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandOpen}
        onClose={handleCloseCommand}
        onMarkAllComplete={markAllComplete}
        onClearCompleted={clearCompleted}
        onResetSample={resetToSample}
        onToggleTheme={handleToggleTheme}
        isDark={isDark}
        onFilterChange={setFilterStatus}
        onFocusAdd={handleFocusAdd}
        onOpenAISettings={handleOpenAISettings}
      />

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={isAISettingsOpen}
        onClose={() => setIsAISettingsOpen(false)}
      />
    </div>
  );
}

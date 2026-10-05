export type Priority = 'low' | 'medium' | 'high';

export type Category = 'Work' | 'Personal' | 'Design' | 'Urgent' | 'General';

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  estimatedTime?: string; // e.g. "15m", "1h", "45m"
  priority: Priority;
  category: Category;
  createdAt: number;
  completedAt?: number;
}

export type FilterStatus = 'all' | 'active' | 'completed';

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  percent: number;
}

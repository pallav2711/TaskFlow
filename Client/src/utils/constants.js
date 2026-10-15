export const TASK_STATUSES = ['To Do', 'In Progress', 'In Review', 'Done'];

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const PROJECT_STATUSES = ['active', 'on-hold', 'completed', 'archived'];

export const PRIORITY_COLORS = {
  Low: 'bg-blue-100 text-blue-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};

export const PRIORITY_DOT_COLORS = {
  Low: 'bg-blue-500',
  Medium: 'bg-yellow-500',
  High: 'bg-orange-500',
  Urgent: 'bg-red-500',
};

export const STATUS_COLORS = {
  'To Do': 'bg-gray-100 text-gray-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'In Review': 'bg-purple-100 text-purple-700',
  Done: 'bg-green-100 text-green-700',
};

export const STATUS_DOT_COLORS = {
  'To Do': 'bg-gray-400',
  'In Progress': 'bg-blue-500',
  'In Review': 'bg-purple-500',
  Done: 'bg-green-500',
};

export const PROJECT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-700',
  'on-hold': 'bg-yellow-100 text-yellow-700',
  completed: 'bg-blue-100 text-blue-700',
  archived: 'bg-gray-100 text-gray-500',
};

export const KANBAN_COLUMNS = [
  { id: 'To Do', label: 'To Do', color: 'border-gray-300' },
  { id: 'In Progress', label: 'In Progress', color: 'border-blue-400' },
  { id: 'In Review', label: 'In Review', color: 'border-purple-400' },
  { id: 'Done', label: 'Done', color: 'border-green-400' },
];

export const PROJECT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6',
];

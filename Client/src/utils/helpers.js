import { format, formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';

/**
 * Format date for display
 */
export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
};

/**
 * Format date as relative time
 */
export const formatRelative = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

/**
 * Returns due date label with urgency context
 */
export const getDueDateLabel = (dueDate) => {
  if (!dueDate) return null;
  const d = new Date(dueDate);
  if (isToday(d)) return { label: 'Due today', urgent: true };
  if (isTomorrow(d)) return { label: 'Due tomorrow', urgent: true };
  if (isPast(d)) return { label: `Overdue · ${formatDate(dueDate)}`, urgent: true, overdue: true };
  return { label: formatDate(dueDate), urgent: false };
};

/**
 * Check if a task is overdue
 */
export const isTaskOverdue = (task) => {
  if (!task.dueDate || task.status === 'Done') return false;
  return isPast(new Date(task.dueDate));
};

/**
 * Get initials from a name
 */
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate a consistent color from a string (for avatars)
 */
export const stringToColor = (str = '') => {
  const colors = [
    'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-red-500',
    'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-teal-500',
    'bg-cyan-500', 'bg-blue-500',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/**
 * Debounce function
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

/**
 * Truncate text to a max length
 */
export const truncate = (str, max = 60) => {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '…' : str;
};

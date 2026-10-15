import api from './axios';

/**
 * Fetch all dashboard statistics for the current user
 * Returns: { tasks: { total, byStatus, byPriority, overdue }, myTasks, projects, recentTasks }
 */
export const getDashboardStats = () => api.get('/dashboard/stats');

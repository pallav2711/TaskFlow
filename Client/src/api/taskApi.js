import api from './axios';

/**
 * Get tasks with optional filters/search/sort/pagination
 * @param {Object} params - { project, status, priority, assignee, search, sortBy, order, page, limit }
 */
export const getTasks = (params = {}) => api.get('/tasks', { params });

/**
 * Get a single task by ID
 * @param {string} id
 */
export const getTask = (id) => api.get(`/tasks/${id}`);

/**
 * Create a new task
 * @param {{ title, description?, priority?, status?, project, assignee?, dueDate? }} data
 */
export const createTask = (data) => api.post('/tasks', data);

/**
 * Update a task (full update)
 * @param {string} id
 * @param {Object} data
 */
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);

/**
 * Update only the status of a task (Kanban drag-and-drop)
 * @param {string} id
 * @param {string} status
 */
export const updateTaskStatus = (id, status) =>
  api.patch(`/tasks/${id}/status`, { status });

/**
 * Delete a task
 * @param {string} id
 */
export const deleteTask = (id) => api.delete(`/tasks/${id}`);

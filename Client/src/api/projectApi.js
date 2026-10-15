import api from './axios';

/**
 * Get all projects for the current user
 */
export const getProjects = () => api.get('/projects');

/**
 * Get a single project by ID
 * @param {string} id
 */
export const getProject = (id) => api.get(`/projects/${id}`);

/**
 * Create a new project
 * @param {{ title, description?, status?, color?, members? }} data
 */
export const createProject = (data) => api.post('/projects', data);

/**
 * Update a project
 * @param {string} id
 * @param {{ title?, description?, status?, color? }} data
 */
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);

/**
 * Delete a project (and all its tasks)
 * @param {string} id
 */
export const deleteProject = (id) => api.delete(`/projects/${id}`);

/**
 * Remove a member from a project
 * @param {string} projectId
 * @param {string} userId
 */
export const removeMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);

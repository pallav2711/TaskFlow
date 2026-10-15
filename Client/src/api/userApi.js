import api from './axios';

/**
 * Get all users (for assignee / member dropdowns)
 * @param {string} search - optional name/email search string
 */
export const getUsers = (search = '') =>
  api.get('/users', { params: search ? { search } : {} });

/**
 * Get a user by ID
 * @param {string} id
 */
export const getUserById = (id) => api.get(`/users/${id}`);

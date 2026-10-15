import api from './axios';

/**
 * Register a new user
 * @param {{ name, email, password }} data
 */
export const registerUser = (data) => api.post('/auth/register', data);

/**
 * Login with email and password
 * @param {{ email, password }} data
 */
export const loginUser = (data) => api.post('/auth/login', data);

/**
 * Get current authenticated user
 */
export const getMe = () => api.get('/auth/me');

/**
 * Update own profile (name, avatar)
 * @param {{ name?, avatar? }} data
 */
export const updateMe = (data) => api.put('/auth/me', data);

/**
 * Change password
 * @param {{ currentPassword, newPassword }} data
 */
export const changePassword = (data) => api.put('/auth/change-password', data);

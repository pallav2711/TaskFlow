import api from './axios';

/** Send a project invite (manager only) */
export const sendInvite = (projectId, email) =>
  api.post('/invites', { projectId, email });

/** Manager: get all invites sent for a project */
export const getSentInvites = (projectId) =>
  api.get('/invites/sent', { params: { projectId } });

/** Developer: get own pending invites */
export const getMyInvites = () => api.get('/invites/inbox');

/** Accept an invite */
export const acceptInvite = (id) => api.patch(`/invites/${id}/accept`);

/** Decline an invite */
export const declineInvite = (id) => api.patch(`/invites/${id}/decline`);

/** Manager: cancel a pending invite */
export const cancelInvite = (id) => api.delete(`/invites/${id}`);

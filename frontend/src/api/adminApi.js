import apiClient from './axiosClient';

export const adminApi = {
  getStats: () => apiClient.get('/admin/stats').then((r) => r.data),

  listUsers: (params) => apiClient.get('/admin/users', { params }).then((r) => r.data),
  setUserSuspension: (userId, suspended) =>
    apiClient.patch(`/admin/users/${userId}/suspend`, { suspended }).then((r) => r.data.user),

  listGyms: (params) => apiClient.get('/admin/gyms', { params }).then((r) => r.data),
  setGymSuspension: (gymId, suspended) =>
    apiClient.patch(`/admin/gyms/${gymId}/suspend`, { suspended }).then((r) => r.data.gym),

  listReviews: (params) => apiClient.get('/admin/reviews', { params }).then((r) => r.data),
  deleteReview: (reviewId) => apiClient.delete(`/admin/reviews/${reviewId}`).then((r) => r.data),
};
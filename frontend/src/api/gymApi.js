import apiClient from './axiosClient';

export const gymApi = {
  register: (payload) => apiClient.post('/gyms', payload).then((r) => r.data.gym),
  listMine: () => apiClient.get('/gyms/mine').then((r) => r.data.gyms),
  list: (params) => apiClient.get('/gyms', { params }).then((r) => r.data),
  getDetail: (gymId) => apiClient.get(`/gyms/${gymId}`).then((r) => r.data),
  getOverview: (gymId) => apiClient.get(`/gyms/${gymId}/overview`).then((r) => r.data),
  getMembers: (gymId, params) => apiClient.get(`/gyms/${gymId}/members`, { params }).then((r) => r.data),
  getLeaderboard: (gymId) => apiClient.get(`/gyms/${gymId}/leaderboard`).then((r) => r.data.leaderboard),

  listPlans: (gymId) => apiClient.get(`/gyms/${gymId}/membership-plans`).then((r) => r.data.plans),
  createPlan: (gymId, payload) =>
    apiClient.post(`/gyms/${gymId}/membership-plans`, payload).then((r) => r.data.plan),
  joinGym: (gymId, planId) =>
    apiClient.post(`/gyms/${gymId}/memberships`, { planId }).then((r) => r.data.membership),
  listMyMemberships: () => apiClient.get('/memberships/mine').then((r) => r.data.memberships),
  renewMembership: (membershipId) =>
    apiClient.post(`/memberships/${membershipId}/renew`).then((r) => r.data.membership),

  listProducts: (gymId) => apiClient.get(`/gyms/${gymId}/products`).then((r) => r.data.products),
  createProduct: (gymId, payload) =>
    apiClient.post(`/gyms/${gymId}/products`, payload).then((r) => r.data.product),
  createOrder: (gymId, items) =>
    apiClient.post(`/gyms/${gymId}/orders`, { items }).then((r) => r.data.order),

  listReviews: (gymId) => apiClient.get(`/gyms/${gymId}/reviews`).then((r) => r.data.reviews),
  createReview: (gymId, payload) =>
    apiClient.post(`/gyms/${gymId}/reviews`, payload).then((r) => r.data.review),
};
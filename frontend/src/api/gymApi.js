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

  // joinGym/renewMembership/createOrder deliberately return the FULL
  // response body (not just .membership/.order) — it also carries
  // requiresPayment/payment/razorpayOrder, which the calling page needs to
  // decide whether to open Razorpay Checkout. See utils/checkout.js.
  joinGym: (gymId, planId) => apiClient.post(`/gyms/${gymId}/memberships`, { planId }).then((r) => r.data),
  listMyMemberships: () => apiClient.get('/memberships/mine').then((r) => r.data.memberships),
  renewMembership: (membershipId) =>
    apiClient.post(`/memberships/${membershipId}/renew`).then((r) => r.data),

  listProducts: (gymId) => apiClient.get(`/gyms/${gymId}/products`).then((r) => r.data.products),
  createProduct: (gymId, payload) =>
    apiClient.post(`/gyms/${gymId}/products`, payload).then((r) => r.data.product),
  createOrder: (gymId, items) => apiClient.post(`/gyms/${gymId}/orders`, { items }).then((r) => r.data),

  listReviews: (gymId) => apiClient.get(`/gyms/${gymId}/reviews`).then((r) => r.data.reviews),
  createReview: (gymId, payload) =>
    apiClient.post(`/gyms/${gymId}/reviews`, payload).then((r) => r.data.review),

  listStaff: (gymId) => apiClient.get(`/gyms/${gymId}/staff`).then((r) => r.data.staff),
  inviteStaff: (gymId, payload) =>
    apiClient.post(`/gyms/${gymId}/staff`, payload).then((r) => r.data.staffMember),
  updateStaffPermissions: (gymId, staffMemberId, permissions) =>
    apiClient
      .patch(`/gyms/${gymId}/staff/${staffMemberId}`, { permissions })
      .then((r) => r.data.staffMember),
  removeStaff: (gymId, staffMemberId) =>
    apiClient.delete(`/gyms/${gymId}/staff/${staffMemberId}`).then((r) => r.data.staffMember),
};

// Keep in sync with backend/src/models/GymStaffMember.js STAFF_PERMISSIONS.
export const STAFF_PERMISSIONS = [
  { value: 'view_overview', label: 'View overview' },
  { value: 'manage_members', label: 'Manage members' },
  { value: 'manage_plans', label: 'Manage membership plans' },
  { value: 'manage_products', label: 'Manage store products' },
  { value: 'manage_attendance', label: 'Manage attendance' },
];
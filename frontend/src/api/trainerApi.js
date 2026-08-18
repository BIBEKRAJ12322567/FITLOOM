import apiClient from './axiosClient';

export const trainerApi = {
  list: (params) => apiClient.get('/trainers', { params }).then((r) => r.data.trainers),
  getDetail: (trainerId) => apiClient.get(`/trainers/${trainerId}`).then((r) => r.data.trainer),

  getMyProfile: () => apiClient.get('/trainers/profile/me').then((r) => r.data.profile),
  upsertMyProfile: (payload) => apiClient.put('/trainers/profile', payload).then((r) => r.data.profile),

  book: (trainerId, payload) =>
    apiClient.post(`/trainers/${trainerId}/bookings`, payload).then((r) => r.data.booking),
  listMyBookings: () => apiClient.get('/trainers/bookings/me').then((r) => r.data.bookings),
  listIncomingBookings: () => apiClient.get('/trainers/bookings/incoming').then((r) => r.data.bookings),
  updateBookingStatus: (bookingId, status) =>
    apiClient.patch(`/trainers/bookings/${bookingId}/status`, { status }).then((r) => r.data.booking),
};
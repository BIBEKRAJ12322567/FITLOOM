import apiClient from './axiosClient';

export const attendanceApi = {
  checkIn: (gymId, method = 'app') =>
    apiClient.post(`/gyms/${gymId}/attendance/check-in`, { method }).then((r) => r.data),
  checkOut: (gymId) => apiClient.post(`/gyms/${gymId}/attendance/check-out`).then((r) => r.data),
  listMine: (gymId) => apiClient.get(`/gyms/${gymId}/attendance/mine`).then((r) => r.data.attendance),
  listGymLog: (gymId) => apiClient.get(`/gyms/${gymId}/attendance`).then((r) => r.data.attendance),
  staffCheckIn: (gymId, memberId) =>
    apiClient.post(`/gyms/${gymId}/attendance/check-in/${memberId}`).then((r) => r.data),
};
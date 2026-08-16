import apiClient from './axiosClient';

export const workoutApi = {
  listMyPlans: () => apiClient.get('/workouts').then((r) => r.data.plans),
  createLog: (payload) => apiClient.post('/workouts/logs', payload).then((r) => r.data),
  listLogs: (limit) => apiClient.get('/workouts/logs', { params: { limit } }).then((r) => r.data.logs),
};
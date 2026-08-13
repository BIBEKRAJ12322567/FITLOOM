import apiClient from './axiosClient';

export const aiApi = {
  generateWorkout: (options) => apiClient.post('/ai/workouts/generate', options).then((r) => r.data),
  generateDietPlan: (options) => apiClient.post('/ai/diet/generate', options).then((r) => r.data),
};
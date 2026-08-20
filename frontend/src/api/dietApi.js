import apiClient from './axiosClient';

export const dietApi = {
  listMyPlans: () => apiClient.get('/diet').then((r) => r.data.plans),
};

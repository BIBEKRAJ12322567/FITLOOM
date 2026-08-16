import apiClient from './axiosClient';

export const exerciseApi = {
  list: (params) => apiClient.get('/exercises', { params }).then((r) => r.data),
  getById: (id) => apiClient.get(`/exercises/${id}`).then((r) => r.data.exercise),
  getByIds: (ids) =>
    apiClient.get('/exercises/batch', { params: { ids: ids.join(',') } }).then((r) => r.data.exercises),
};
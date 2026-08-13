import apiClient from './axiosClient';
 
export const exerciseApi = {
  getByIds: (ids) =>
    apiClient.get('/exercises', { params: { ids: ids.join(',') } }).then((r) => r.data.exercises),
};
 
import apiClient from './axiosClient';

export const paymentApi = {
  verify: (paymentId, payload) =>
    apiClient.post(`/payments/${paymentId}/verify`, payload).then((r) => r.data.payment),
};
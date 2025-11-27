import api from './api';

const recommendationService = {
  async getUserRecommendations() {
    const res = await api.get('/recommendation/user/');
    return res.data;
  },
  async getStaffRecommendations() {
    const res = await api.get('/recommendation/staff/');
    return res.data;
  },
  async getAdminRecommendations() {
    const res = await api.get('/recommendation/');
    return res.data;
  }
};

export default recommendationService;

import api from './api';

const wasteService = {
  async getUserWaste() {
    const res = await api.get('/waste/user/');
    return res.data;
  },
  async getStaffWaste() {
    const res = await api.get('/waste/staff/');
    return res.data;
  },
  async getAdminWaste() {
    const res = await api.get('/waste/');
    return res.data;
  }
};

export default wasteService;

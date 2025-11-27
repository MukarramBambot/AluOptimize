import api from './api';

// Prediction service for staff operations
export const predictionService = {
  // Generate prediction for a pending input
  async generatePrediction(inputId) {
    try {
      const response = await api.post(`/prediction/inputs/${inputId}/generate_prediction/`);
      return response.data;
    } catch (error) {
      console.error('Error generating prediction:', error);
      throw error;
    }
  },

  // Send prediction to user
  async sendToUser(inputId) {
    try {
      const response = await api.post(`/prediction/inputs/${inputId}/send_to_user/`);
      return response.data;
    } catch (error) {
      console.error('Error sending prediction to user:', error);
      throw error;
    }
  },

  // Reject input
  async rejectInput(inputId) {
    try {
      const response = await api.post(`/prediction/inputs/${inputId}/reject/`);
      return response.data;
    } catch (error) {
      console.error('Error rejecting input:', error);
      throw error;
    }
  },

  // Get all production inputs (for admin panel)
  async getAllInputs(params = {}) {
    try {
      const response = await api.get('/prediction/inputs/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching inputs:', error);
      throw error;
    }
  },

  // Get pending inputs
  async getPendingInputs() {
    try {
      const response = await api.get('/prediction/pending/');
      return response.data;
    } catch (error) {
      console.error('Error fetching pending inputs:', error);
      throw error;
    }
  },

  // Get user's predictions (only sent ones)
  async getUserPredictions() {
    try {
      const response = await api.get('/prediction/user/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user predictions:', error);
      throw error;
    }
  }
};

export default predictionService;

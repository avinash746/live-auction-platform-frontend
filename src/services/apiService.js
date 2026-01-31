import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all auction items
   */
  async getItems() {
    try {
      const response = await this.client.get('/items');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch items');
    }
  }

  /**
   * Get single auction item
   */
  async getItem(itemId) {
    try {
      const response = await this.client.get(`/items/${itemId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to fetch item');
    }
  }

  /**
   * Get server time for synchronization
   */
  async getServerTime() {
    try {
      const response = await this.client.get('/time');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get server time');
    }
  }

  /**
   * Reset auction (demo/testing)
   */
  async resetAuction(itemId) {
    try {
      const response = await this.client.post(`/items/${itemId}/reset`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to reset auction');
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      throw new Error('Health check failed');
    }
  }
}

export default new ApiService();
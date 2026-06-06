import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { storage, StorageKeys, removeStorageItem } from '../store/storage';

import Constants from 'expo-constants';

const getBaseUrl = () => {
  // To connect to a local backend during development, uncomment the block below:
  /*
  if (__DEV__) {
    const debuggerHost = Constants.expoConfig?.hostUri || '';
    const ipAddress = debuggerHost.split(':')[0] || 'localhost';
    return `http://${ipAddress}:8080/api/v1`;
  }
  */
  return 'https://expenseos.onrender.com/api/v1';
};

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getString(StorageKeys.ACCESS_TOKEN);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle errors globally (e.g. 401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      // Global 401 Unauthorized handling (token expired/invalid)
      if (status === 401) {
        removeStorageItem(StorageKeys.ACCESS_TOKEN);
        // You could trigger a custom event or callback here to reset the Auth state
      }
    } else if (error.request) {
      console.warn('Network Error: No response received from server.');
    } else {
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

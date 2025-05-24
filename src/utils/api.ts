// 前端API调用工具函数
import axios, { AxiosResponse } from 'axios';
import { DebateRequest, DebateApiResponse, DebateResult } from '@/types';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5分钟超时，因为LLM调用可能较慢
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    
    // 统一错误处理
    if (error.response?.status === 429) {
      throw new Error('请求过于频繁，请稍后再试');
    } else if (error.response?.status === 500) {
      throw new Error('服务器内部错误，请稍后再试');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('请求超时，请检查网络连接');
    } else if (!error.response) {
      throw new Error('网络连接失败，请检查网络设置');
    }
    
    return Promise.reject(error);
  }
);

/**
 * 发起辩论请求
 * @param request 辩论请求参数
 * @returns Promise<DebateResult>
 */
export const startDebate = async (request: DebateRequest): Promise<DebateResult> => {
  try {
    const response = await api.post<DebateApiResponse>('/debate', request);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    } else {
      throw new Error(response.data.error?.message || '辩论请求失败');
    }
  } catch (error) {
    console.error('Start debate error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error?.message) {
        throw new Error(error.response.data.error.message);
      }
    }
    
    // 重新抛出已处理的错误
    throw error;
  }
};

/**
 * 获取可用的LLM模型列表
 * @returns Promise<ModelConfig[]>
 */
export const getAvailableModels = async () => {
  try {
    const response = await api.get('/models');
    return response.data;
  } catch (error) {
    console.error('Get models error:', error);
    throw error;
  }
};

/**
 * 健康检查API
 * @returns Promise<boolean>
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch (error) {
    console.error('Health check error:', error);
    return false;
  }
};

/**
 * 格式化错误消息
 * @param error 错误对象
 * @returns 格式化的错误消息
 */
export const formatErrorMessage = (error: any): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (axios.isAxiosError(error)) {
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  
  return '发生未知错误，请稍后再试';
};

/**
 * 模拟延迟（用于测试）
 * @param ms 延迟毫秒数
 */
export const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

export default api;

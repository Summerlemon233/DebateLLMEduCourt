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
 * 发起辩论请求（SSE流式版本 - 真实进度反馈）
 * @param request 辩论请求参数
 * @param onStageUpdate 阶段更新回调
 * @returns Promise<DebateResult>
 */
export const startDebateWithRealProgress = async (
  request: DebateRequest, 
  onStageUpdate?: (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string, message?: string) => void
): Promise<DebateResult> => {
  return new Promise(async (resolve, reject) => {
    try {
      // 第一步：发送POST请求获取会话ID
      const postResponse = await fetch('/api/debate-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!postResponse.ok) {
        throw new Error(`Failed to start debate: ${postResponse.statusText}`);
      }

      const { sessionId } = await postResponse.json();
      
      if (!sessionId) {
        throw new Error('No session ID received');
      }

      // 第二步：创建SSE连接
      const eventSource = new EventSource(`/api/debate-stream?sessionId=${sessionId}`);

      let result: DebateResult | null = null;

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case 'stage_start':
            case 'stage_progress':
            case 'model_complete':
              if (onStageUpdate) {
                const stageMap: { [key: number]: 'initial' | 'refined' | 'final' } = {
                  1: 'initial',
                  2: 'refined',
                  3: 'final'
                };
                const stage = stageMap[data.stage] || 'initial';
                onStageUpdate(stage, data.progress, data.currentModel, data.message);
              }
              break;
              
            case 'stage_complete':
              if (onStageUpdate) {
                const stageMap: { [key: number]: 'initial' | 'refined' | 'final' } = {
                  1: 'initial',
                  2: 'refined',
                  3: 'final'
                };
                const stage = stageMap[data.stage] || 'initial';
                onStageUpdate(stage, data.progress, undefined, data.message);
              }
              break;
              
            case 'complete':
              result = data.data;
              if (onStageUpdate) {
                onStageUpdate('final', 100, undefined, data.message);
              }
              eventSource.close();
              if (result) {
                resolve(result);
              } else {
                reject(new Error('No result data received'));
              }
              break;
              
            case 'error':
              eventSource.close();
              reject(new Error(data.message || 'Unknown error occurred'));
              break;
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        eventSource.close();
        reject(new Error('Connection error'));
      };

      // 5分钟超时
      const timeout = setTimeout(() => {
        eventSource.close();
        reject(new Error('Request timeout'));
      }, 300000);

      // 清理函数
      const cleanup = () => {
        clearTimeout(timeout);
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
      };

      // 确保在Promise完成时清理资源
      Promise.resolve().then(() => {
        return new Promise<void>((resolveCleanup) => {
          const checkClosed = () => {
            if (eventSource.readyState === EventSource.CLOSED) {
              cleanup();
              resolveCleanup();
            } else {
              setTimeout(checkClosed, 100);
            }
          };
          checkClosed();
        });
      });

    } catch (error) {
      reject(error);
    }
  });
};
            if (onStageUpdate) {
              const stageMap: { [key: number]: 'initial' | 'refined' | 'final' } = {
                1: 'initial',
                2: 'refined',
                3: 'final'
              };
              const stage = stageMap[data.stage] || 'initial';
              onStageUpdate(stage, data.progress, undefined, data.message);
            }
            break;
            
          case 'complete':
            result = data.data;
            if (onStageUpdate) {
              onStageUpdate('final', 100, undefined, data.message);
            }
            eventSource.close();
            if (result) {
              resolve(result);
            } else {
              reject(new Error('No result data received'));
            }
            break;
            
          case 'error':
            eventSource.close();
            reject(new Error(data.message || 'Unknown error occurred'));
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();
      reject(new Error('Connection error'));
    };

    // 30秒超时
    const timeout = setTimeout(() => {
      eventSource.close();
      reject(new Error('Request timeout'));
    }, 300000); // 5分钟超时

    // 清理函数
    const cleanup = () => {
      clearTimeout(timeout);
      if (eventSource.readyState !== EventSource.CLOSED) {
        eventSource.close();
      }
    };

    // 确保在Promise完成时清理资源
    Promise.resolve().then(() => {
      return new Promise<void>((resolveCleanup) => {
        const checkClosed = () => {
          if (eventSource.readyState === EventSource.CLOSED) {
            cleanup();
            resolveCleanup();
          } else {
            setTimeout(checkClosed, 100);
          }
        };
        checkClosed();
      });
    });
  });
};

/**
 * 发起辩论请求（带阶段更新回调 - 备用方案）
 * @param request 辩论请求参数
 * @param onStageUpdate 阶段更新回调
 * @returns Promise<DebateResult>
 */
export const startDebate = async (
  request: DebateRequest, 
  onStageUpdate?: (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string) => void
): Promise<DebateResult> => {
  // 优先使用SSE版本，如果失败则回退到原版本
  try {
    return await startDebateWithRealProgress(request, onStageUpdate);
  } catch (error) {
    console.warn('SSE version failed, falling back to original version:', error);
    
    // 回退到模拟版本
    try {
      // 模拟阶段更新（原有逻辑作为备用）
      let currentProgress = 0;
      const stages: Array<'initial' | 'refined' | 'final'> = ['initial', 'refined', 'final'];
      let currentStageIndex = 0;
      
      const updateInterval = setInterval(() => {
        if (onStageUpdate && currentStageIndex < stages.length) {
          const stage = stages[currentStageIndex];
          const stageProgress = Math.min(currentProgress + Math.random() * 15, 90);
          onStageUpdate(stage, stageProgress);
          currentProgress = stageProgress;
          
          // 每30%进度切换到下一阶段
          if (currentProgress >= (currentStageIndex + 1) * 30) {
            currentStageIndex++;
          }
        }
      }, 1500);

      const response = await api.post<DebateApiResponse>('/debate', request);
      
      // 清除进度更新
      clearInterval(updateInterval);
      
      // 最终阶段完成
      if (onStageUpdate) {
        onStageUpdate('final', 100);
      }
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.error || '辩论请求失败');
      }
    } catch (apiError) {
      console.error('Start debate error:', apiError);
      
      if (axios.isAxiosError(apiError)) {
        if (apiError.response?.data?.error) {
          throw new Error(apiError.response.data.error);
        }
      }
      
      throw apiError;
    }
  }
};

/**
 * 获取模型健康状态
 * @returns Promise<any>
 */
export const getModelsHealth = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Get models health error:', error);
    throw error;
  }
};

/**
 * 测试单个模型
 * @param model 模型名称
 * @param prompt 测试提示词
 * @returns Promise<any>
 */
export const testModel = async (model: string, prompt: string) => {
  try {
    const response = await api.post('/test', { model, prompt });
    return response.data;
  } catch (error) {
    console.error('Test model error:', error);
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

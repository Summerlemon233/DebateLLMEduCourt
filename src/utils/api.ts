// 前端API调用工具函数
import axios, { AxiosResponse } from 'axios';
import { DebateRequest, DebateApiResponse, DebateResult, EoTStrategy } from '@/types';

// EoT请求接口
export interface EoTRequest {
  question: string;
  models: string[];
  config?: any;
  eotStrategy: EoTStrategy;
}

// EoT响应接口
export interface EoTApiResponse {
  success: boolean;
  data?: DebateResult;
  error?: string;
  timestamp: string;
}

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
 * 使用真实进度反馈的辩论函数（通过SSE）
 */
export async function startDebateWithRealProgress(
  request: DebateRequest,
  onStageUpdate?: (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string, message?: string) => void,
  onStageComplete?: (stageNumber: number, stageData: any) => void
): Promise<DebateResult> {
  console.log('🚀 [SSE] Starting debate with real progress feedback');
  console.log('📋 [SSE] Request data:', request);
  console.log('🔄 [SSE] Stage callback provided:', !!onStageUpdate);

  return new Promise(async (resolve, reject) => {
    try {
      // 步骤1：存储请求数据并获取会话ID
      console.log('📤 [SSE] Step 1: Storing request data...');
      const sessionResponse = await api.post('/debate-stream', request);
      console.log('✅ [SSE] Session response:', sessionResponse.data);
      
      if (!sessionResponse.data.success || !sessionResponse.data.sessionId) {
        console.error('❌ [SSE] Failed to create session:', sessionResponse.data);
        throw new Error('Failed to create debate session');
      }
      
      const sessionId = sessionResponse.data.sessionId;
      console.log(`🔐 [SSE] Session ID obtained: ${sessionId}`);
      
      // 步骤2：建立SSE连接
      console.log('📡 [SSE] Step 2: Establishing SSE connection...');
      const eventSourceUrl = `/api/debate-stream?sessionId=${sessionId}`;
      console.log('🌐 [SSE] EventSource URL:', eventSourceUrl);
      
      const eventSource = new EventSource(eventSourceUrl);
      console.log('🔗 [SSE] EventSource created, initial state:', eventSource.readyState);
      
      let result: DebateResult | null = null;
      let messageCount = 0;
      let connectionEstablished = false;

      eventSource.onopen = (event) => {
        connectionEstablished = true;
        console.log('✅ [SSE] Connection opened successfully');
        console.log('🔍 [SSE] EventSource readyState:', eventSource.readyState);
        console.log('🔍 [SSE] Open event details:', event);
      };

      eventSource.onmessage = (event) => {
        messageCount++;
        console.log(`📨 [SSE] Message #${messageCount} received`);
        console.log('📨 [SSE] Raw event data:', event.data);
        console.log('📨 [SSE] Event origin:', event.origin);
        console.log('📨 [SSE] Event lastEventId:', event.lastEventId);
        
        try {
          const data = JSON.parse(event.data);
          console.log('📊 [SSE] Parsed data:', data);
          console.log('📊 [SSE] Event type:', data.type);
          
          switch (data.type) {
            case 'connected':
              console.log('🔗 [SSE] Connection confirmation received');
              console.log('🔐 [SSE] Session ID in response:', data.sessionId);
              break;
              
            case 'stage_start':
            case 'stage_progress':
            case 'model_complete':
              console.log(`🎯 [SSE] Progress event - Type: ${data.type}`);
              console.log(`🎯 [SSE] Stage: ${data.stage}, Progress: ${data.progress}%, Model: ${data.currentModel}`);
              console.log(`🎯 [SSE] Current stage: ${data.currentStage}, Message: ${data.message}`);
              
              if (onStageUpdate) {
                const stageMap: { [key: number]: 'initial' | 'refined' | 'final' } = {
                  1: 'initial',
                  2: 'refined',
                  3: 'final'
                };
                const stage = stageMap[data.stage] || 'initial';
                
                console.log(`🔄 [SSE] About to call onStageUpdate with:`);
                console.log(`    - Stage: ${stage} (mapped from ${data.stage})`);
                console.log(`    - Progress: ${data.progress}%`);
                console.log(`    - Current model: ${data.currentModel}`);
                console.log(`    - Message: ${data.message}`);
                
                try {
                  onStageUpdate(stage, data.progress, data.currentModel, data.message);
                  console.log(`✅ [SSE] onStageUpdate callback completed successfully`);
                } catch (callbackError) {
                  console.error('❌ [SSE] Error in onStageUpdate callback:', callbackError);
                }
              } else {
                console.warn('⚠️ [SSE] onStageUpdate callback is not defined');
              }
              break;
              
            case 'stage_complete':
              console.log(`✅ [SSE] Stage ${data.stage} completed with ${data.progress}% progress`);
              console.log(`✅ [SSE] Stage complete message: ${data.message}`);
              console.log(`📊 [SSE] Stage data:`, data.stageData);
              
              // 处理阶段完成回调
              if (onStageComplete && data.stageData) {
                console.log(`🔄 [SSE] Calling onStageComplete for stage ${data.stage}`);
                try {
                  onStageComplete(data.stage, data.stageData);
                  console.log(`✅ [SSE] Stage complete callback completed`);
                } catch (callbackError) {
                  console.error('❌ [SSE] Error in onStageComplete callback:', callbackError);
                }
              }
              
              if (onStageUpdate) {
                const stageMap: { [key: number]: 'initial' | 'refined' | 'final' } = {
                  1: 'initial',
                  2: 'refined',
                  3: 'final'
                };
                const stage = stageMap[data.stage] || 'initial';
                
                console.log(`🔄 [SSE] Calling onStageUpdate for stage completion:`);
                console.log(`    - Stage: ${stage} (mapped from ${data.stage})`);
                console.log(`    - Progress: ${data.progress}%`);
                console.log(`    - Message: ${data.message}`);
                
                try {
                  onStageUpdate(stage, data.progress, undefined, data.message);
                  console.log(`✅ [SSE] Stage completion callback completed`);
                } catch (callbackError) {
                  console.error('❌ [SSE] Error in stage completion callback:', callbackError);
                }
              }
              break;
              
            case 'complete':
              console.log('🎉 [SSE] Debate completed successfully');
              console.log('🎉 [SSE] Final result data:', data.data);
              
              result = data.data;
              if (onStageUpdate) {
                console.log('🔄 [SSE] Calling final onStageUpdate (100% completion)');
                try {
                  onStageUpdate('final', 100, undefined, data.message);
                  console.log('✅ [SSE] Final callback completed');
                } catch (callbackError) {
                  console.error('❌ [SSE] Error in final callback:', callbackError);
                }
              }
              
              console.log('🔒 [SSE] Closing EventSource connection');
              eventSource.close();
              
              if (result) {
                console.log('✅ [SSE] Resolving promise with result');
                resolve(result);
              } else {
                console.error('❌ [SSE] No result data received');
                reject(new Error('No result data received'));
              }
              break;
              
            case 'error':
              console.error('❌ [SSE] Error event received:', data.message);
              console.error('❌ [SSE] Error details:', data);
              eventSource.close();
              reject(new Error(data.message || 'Unknown error occurred'));
              break;
              
            default:
              console.warn('⚠️ [SSE] Unknown event type:', data.type);
              console.warn('⚠️ [SSE] Full data:', data);
              break;
          }
        } catch (parseError) {
          console.error('❌ [SSE] Error parsing SSE data:', parseError);
          console.error('📋 [SSE] Raw event data that failed to parse:', event.data);
          console.error('📋 [SSE] Parse error details:', parseError);
        }
      };

      eventSource.onerror = (error) => {
        console.error('❌ [SSE] Connection error occurred');
        console.error('🔍 [SSE] Error event:', error);
        console.error('🔍 [SSE] EventSource readyState:', eventSource.readyState);
        console.error('🔍 [SSE] EventSource url:', eventSource.url);
        console.error('🔍 [SSE] Connection was established:', connectionEstablished);
        console.error('🔍 [SSE] Messages received before error:', messageCount);
        
        // 根据readyState判断错误类型
        switch (eventSource.readyState) {
          case EventSource.CONNECTING:
            console.error('🔍 [SSE] State: CONNECTING (0) - Initial connection failed');
            break;
          case EventSource.OPEN:
            console.error('🔍 [SSE] State: OPEN (1) - Connection was open but error occurred');
            break;
          case EventSource.CLOSED:
            console.error('🔍 [SSE] State: CLOSED (2) - Connection is closed');
            break;
          default:
            console.error('🔍 [SSE] State: Unknown state');
        }
        
        eventSource.close();
        reject(new Error('SSE Connection error'));
      };

      // 5分钟超时
      const timeout = setTimeout(() => {
        console.error('⏰ [SSE] Request timeout after 5 minutes');
        console.error('⏰ [SSE] Messages received before timeout:', messageCount);
        console.error('⏰ [SSE] Connection established:', connectionEstablished);
        eventSource.close();
        reject(new Error('Request timeout'));
      }, 300000);

      // 清理函数
      const cleanup = () => {
        console.log('🧹 [SSE] Cleaning up resources');
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
      console.error('❌ [SSE] Error in startDebateWithRealProgress:', error);
      console.error('❌ [SSE] Error details:', error);
      reject(error);
    }
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
  onStageUpdate?: (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string) => void,
  onStageComplete?: (stageNumber: number, stageData: any) => void
): Promise<DebateResult> => {
  console.log('🚀 [Main] ========== Starting Debate ==========');
  console.log('📋 [Main] Request:', JSON.stringify(request, null, 2));
  console.log('🔄 [Main] Has stage callback:', !!onStageUpdate);
  console.log('🕐 [Main] Start time:', new Date().toISOString());
  
  // 优先使用SSE版本，如果失败则回退到原版本
  console.log('🎯 [Main] Attempting real progress feedback (SSE)...');
  
  try {
    const result = await startDebateWithRealProgress(request, onStageUpdate, onStageComplete);
    console.log('✅ [Main] Real progress feedback succeeded');
    console.log('🎉 [Main] Final result received');
    return result;
  } catch (error) {
    console.error('❌ [Main] SSE version failed:', error);
    console.error('❌ [Main] Error details:', error);
    console.log('🔄 [Main] Falling back to simulated progress...');
    
    // 回退到模拟版本
    try {
      console.log('⚡ [Fallback] Starting simulated progress version');
      
      // 模拟阶段更新（原有逻辑作为备用）
      let currentProgress = 0;
      const stages: Array<'initial' | 'refined' | 'final'> = ['initial', 'refined', 'final'];
      let currentStageIndex = 0;
      
      if (onStageUpdate) {
        console.log('🔄 [Fallback] Setting up simulated progress updates');
        
        const updateInterval = setInterval(() => {
          if (currentStageIndex < stages.length) {
            const stage = stages[currentStageIndex];
            const stageProgress = Math.min(currentProgress + Math.random() * 15, 90);
            
            console.log(`🎯 [Fallback] Simulated progress: ${stage} ${stageProgress}%`);
            onStageUpdate(stage, stageProgress);
            currentProgress = stageProgress;
            
            // 每30%进度切换到下一阶段
            if (currentProgress >= (currentStageIndex + 1) * 30) {
              currentStageIndex++;
              console.log(`➡️ [Fallback] Moving to stage index: ${currentStageIndex}`);
            }
          }
        }, 1500);
        
        // 清理函数
        setTimeout(() => {
          clearInterval(updateInterval);
          console.log('🧹 [Fallback] Cleared simulated progress interval');
        }, 30000); // 30秒后自动清理
      }

      console.log('📤 [Fallback] Making API request to /debate');
      const response = await api.post<DebateApiResponse>('/debate', request);
      console.log('✅ [Fallback] API request completed');
      
      // 最终阶段完成
      if (onStageUpdate) {
        console.log('🎉 [Fallback] Setting final progress to 100%');
        onStageUpdate('final', 100);
      }
      
      if (response.data.success && response.data.data) {
        console.log('✅ [Fallback] Debate completed successfully');
        return response.data.data;
      } else {
        console.error('❌ [Fallback] API returned error:', response.data.error);
        throw new Error(response.data.error || '辩论请求失败');
      }
    } catch (apiError) {
      console.error('❌ [Fallback] Start debate error:', apiError);
      
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

/**
 * 发起EoT推理请求
 * @param request EoT请求参数
 * @param onStageUpdate 阶段更新回调
 * @param onStageComplete 阶段完成回调
 * @returns Promise<DebateResult>
 */
export const startEoTReasoning = async (
  request: EoTRequest,
  onStageUpdate?: (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string, message?: string) => void,
  onStageComplete?: (stageNumber: number, stageData: any) => void
): Promise<DebateResult> => {
  console.log('🚀 [EoT] ========== Starting EoT Reasoning ==========');
  console.log('📋 [EoT] Request:', JSON.stringify(request, null, 2));
  console.log('🔄 [EoT] Strategy:', request.eotStrategy);
  console.log('🕐 [EoT] Start time:', new Date().toISOString());

  try {
    // 模拟进度更新
    let currentProgress = 0;
    const stageNames: Array<'initial' | 'refined' | 'final'> = ['initial', 'refined', 'final'];
    let currentStageIndex = 0;

    if (onStageUpdate) {
      console.log('🔄 [EoT] Setting up progress simulation');
      
      const updateInterval = setInterval(() => {
        if (currentStageIndex < stageNames.length) {
          const stage = stageNames[currentStageIndex];
          const stageProgress = Math.min(currentProgress + Math.random() * 12, 85);
          
          console.log(`🎯 [EoT] Progress update: ${stage} ${stageProgress}%`);
          onStageUpdate(stage, stageProgress, undefined, `正在执行${request.eotStrategy}策略...`);
          currentProgress = stageProgress;
          
          // 根据策略调整阶段切换逻辑
          const stageThreshold = 25; // 简化的阶段切换阈值
          if (currentProgress >= stageThreshold) {
            currentStageIndex++;
            console.log(`➡️ [EoT] Moving to stage index: ${currentStageIndex}`);
          }
        }
      }, 2000);
      
      // 清理函数
      setTimeout(() => {
        clearInterval(updateInterval);
        console.log('🧹 [EoT] Cleared progress interval');
      }, 60000); // 60秒后自动清理
    }

    console.log('📤 [EoT] Making API request to /eot');
    const response = await api.post<EoTApiResponse>('/eot', request);
    console.log('✅ [EoT] API request completed');
    
    // 最终阶段完成
    if (onStageUpdate) {
      console.log('🎉 [EoT] Setting final progress to 100%');
      onStageUpdate('final', 100, undefined, '推理完成');
    }
    
    if (response.data.success && response.data.data) {
      console.log('✅ [EoT] Reasoning completed successfully');
      return response.data.data;
    } else {
      console.error('❌ [EoT] API returned error:', response.data.error);
      throw new Error(response.data.error || 'EoT推理请求失败');
    }
  } catch (error) {
    console.error('❌ [EoT] Start EoT reasoning error:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error);
      }
    }
    
    throw error;
  }
};

/**
 * 使用流式传输的EoT推理函数（支持实时进度反馈）
 */
export async function startEoTReasoningWithStream(
  request: EoTRequest,
  onStageUpdate?: (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string, message?: string) => void,
  onStageComplete?: (stageNumber: number, stageData: any) => void
): Promise<DebateResult> {
  console.log('🚀 [EoT-SSE] Starting EoT reasoning with stream feedback');
  console.log('📋 [EoT-SSE] Request data:', request);

  return new Promise(async (resolve, reject) => {
    try {
      // 步骤1：存储请求数据并获取会话ID
      console.log('📤 [EoT-SSE] Step 1: Storing request data...');
      const sessionResponse = await api.post('/eot-stream', request);
      console.log('✅ [EoT-SSE] Session response:', sessionResponse.data);
      
      if (!sessionResponse.data.success || !sessionResponse.data.sessionId) {
        console.error('❌ [EoT-SSE] Failed to create session:', sessionResponse.data);
        throw new Error('Failed to create EoT session');
      }
      
      const sessionId = sessionResponse.data.sessionId;
      console.log(`🔐 [EoT-SSE] Session ID obtained: ${sessionId}`);
      
      // 步骤2：建立SSE连接
      console.log('📡 [EoT-SSE] Step 2: Establishing SSE connection...');
      const eventSourceUrl = `/api/eot-stream?sessionId=${sessionId}`;
      console.log('🌐 [EoT-SSE] EventSource URL:', eventSourceUrl);
      
      const eventSource = new EventSource(eventSourceUrl);
      console.log('🔗 [EoT-SSE] EventSource created, initial state:', eventSource.readyState);
      
      let finalResult: DebateResult | null = null;
      
      // 设置超时机制
      const timeout = setTimeout(() => {
        console.log('⏰ [EoT-SSE] Operation timeout');
        eventSource.close();
        reject(new Error('EoT reasoning timeout'));
      }, 300000); // 5分钟超时
      
      // 监听消息事件
      eventSource.addEventListener('message', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 [EoT-SSE] Message received:', data);
          
          switch (data.type) {
            case 'connected':
              console.log('✅ [EoT-SSE] Connection established');
              break;
              
            case 'stage_start':
              console.log(`🚀 [EoT-SSE] Stage ${data.stage} (${data.title}) started`);
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
              
            case 'model_start':
            case 'model_complete':
            case 'model_error':
              console.log(`🤖 [EoT-SSE] Model ${data.model} ${data.type}`);
              if (onStageUpdate) {
                const stageMap: { [key: number]: 'initial' | 'refined' | 'final' } = {
                  1: 'initial',
                  2: 'refined',
                  3: 'final'
                };
                const stage = stageMap[data.stage] || 'initial';
                onStageUpdate(stage, data.progress, data.model, data.message);
              }
              break;
              
            case 'stage_complete':
              console.log(`✅ [EoT-SSE] Stage ${data.stage} completed`);
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
              
            case 'generating_summary':
              console.log('📝 [EoT-SSE] Generating summary...');
              if (onStageUpdate) {
                onStageUpdate('final', data.progress, undefined, data.message);
              }
              break;
              
            case 'complete':
              console.log('🎉 [EoT-SSE] All stages completed!');
              if (onStageUpdate) {
                onStageUpdate('final', data.progress, undefined, data.message);
              }
              break;
              
            default:
              console.log('ℹ️ [EoT-SSE] Unknown message type:', data.type);
          }
        } catch (parseError) {
          console.error('❌ [EoT-SSE] Error parsing message:', parseError);
        }
      });
      
      // 监听阶段数据事件
      eventSource.addEventListener('stage_data', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📊 [EoT-SSE] Stage data received:', data);
          
          if (onStageComplete && data.stage && data.data) {
            console.log(`🔄 [EoT-SSE] Calling onStageComplete for stage ${data.stage}`);
            onStageComplete(data.stage, data.data);
          }
        } catch (parseError) {
          console.error('❌ [EoT-SSE] Error parsing stage data:', parseError);
        }
      });
      
      // 监听最终结果事件
      eventSource.addEventListener('final_result', (event) => {
        try {
          const result = JSON.parse(event.data);
          console.log('🎯 [EoT-SSE] Final result received:', result);
          finalResult = result;
        } catch (parseError) {
          console.error('❌ [EoT-SSE] Error parsing final result:', parseError);
        }
      });
      
      // 监听错误事件
      eventSource.addEventListener('error_event', (event) => {
        try {
          const errorData = JSON.parse(event.data);
          console.error('❌ [EoT-SSE] Error event received:', errorData);
          eventSource.close();
          reject(new Error(errorData.error || 'EoT reasoning failed'));
        } catch (parseError) {
          console.error('❌ [EoT-SSE] Error parsing error event:', parseError);
          eventSource.close();
          reject(new Error('Unknown error during EoT reasoning'));
        }
      });
      
      // 监听连接关闭
      eventSource.onopen = () => {
        console.log('🟢 [EoT-SSE] Connection opened, readyState:', eventSource.readyState);
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ [EoT-SSE] Connection error:', error);
        console.log('🔍 [EoT-SSE] EventSource readyState:', eventSource.readyState);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔒 [EoT-SSE] Connection closed');
          eventSource.close();
          
          if (finalResult) {
            console.log('✅ [EoT-SSE] Resolving with final result');
            resolve(finalResult);
          } else {
            console.log('❌ [EoT-SSE] No final result received');
            reject(new Error('EoT reasoning completed but no result received'));
          }
        }
      };
      
      // 清理函数
      const cleanup = () => {
        clearTimeout(timeout);
        if (eventSource.readyState !== EventSource.CLOSED) {
          eventSource.close();
        }
      };
      
      // 监听连接关闭 - 重新定义，避免变量重新赋值问题
      eventSource.onopen = () => {
        console.log('🟢 [EoT-SSE] Connection opened, readyState:', eventSource.readyState);
      };
      
      eventSource.onerror = (error) => {
        console.error('❌ [EoT-SSE] Connection error:', error);
        console.log('🔍 [EoT-SSE] EventSource readyState:', eventSource.readyState);
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('🔒 [EoT-SSE] Connection closed');
          cleanup();
          
          if (finalResult) {
            console.log('✅ [EoT-SSE] Resolving with final result');
            resolve(finalResult);
          } else {
            console.log('❌ [EoT-SSE] No final result received');
            reject(new Error('EoT reasoning completed but no result received'));
          }
        }
      };
      
    } catch (error) {
      console.error('❌ [EoT-SSE] Setup error:', error);
      reject(error);
    }
  });
}

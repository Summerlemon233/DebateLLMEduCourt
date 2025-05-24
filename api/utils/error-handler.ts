// 错误处理工具函数
import type { ApiError } from '@/types';

export class DebateError extends Error {
  public code: string;
  public details?: any;
  public timestamp: number;
  public statusCode: number;

  constructor(code: string, message: string, details?: any, statusCode: number = 500) {
    super(message);
    this.name = 'DebateError';
    this.code = code;
    this.details = details;
    this.timestamp = Date.now();
    this.statusCode = statusCode;
  }
}

// 预定义错误类型
export const ErrorCodes = {
  // API相关错误
  API_KEY_MISSING: 'API_KEY_MISSING',
  API_KEY_INVALID: 'API_KEY_INVALID',
  API_RATE_LIMIT: 'API_RATE_LIMIT',
  API_TIMEOUT: 'API_TIMEOUT',
  API_NETWORK_ERROR: 'API_NETWORK_ERROR',
  API_RESPONSE_ERROR: 'API_RESPONSE_ERROR',
  
  // 模型相关错误
  MODEL_UNAVAILABLE: 'MODEL_UNAVAILABLE',
  MODEL_RESPONSE_EMPTY: 'MODEL_RESPONSE_EMPTY',
  MODEL_RESPONSE_INVALID: 'MODEL_RESPONSE_INVALID',
  
  // 业务逻辑错误
  INVALID_REQUEST: 'INVALID_REQUEST',
  MISSING_PARAMETERS: 'MISSING_PARAMETERS',
  DEBATE_TIMEOUT: 'DEBATE_TIMEOUT',
  
  // 系统错误
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

/**
 * 创建标准化的API错误对象
 */
export function createApiError(
  code: string,
  message: string,
  details?: any
): ApiError {
  return {
    code,
    message,
    details,
    timestamp: Date.now(),
  };
}

/**
 * 错误处理中间件 - 用于Vercel Functions
 */
export function withErrorHandler<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      console.error('API Error:', error);
      
      // 如果是已知的DebateError，直接抛出
      if (error instanceof DebateError) {
        throw error;
      }
      
      // 处理常见的HTTP错误
      if (error && typeof error === 'object') {
        const err = error as any;
        
        if (err.response?.status === 401) {
          throw new DebateError(
            ErrorCodes.API_KEY_INVALID,
            'API密钥无效或已过期',
            { status: err.response.status }
          );
        }
        
        if (err.response?.status === 429) {
          throw new DebateError(
            ErrorCodes.API_RATE_LIMIT,
            '请求频率过高，请稍后再试',
            { status: err.response.status }
          );
        }
        
        if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
          throw new DebateError(
            ErrorCodes.API_TIMEOUT,
            '请求超时，请稍后再试',
            { code: err.code }
          );
        }
        
        if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
          throw new DebateError(
            ErrorCodes.API_NETWORK_ERROR,
            '网络连接失败',
            { code: err.code }
          );
        }
      }
      
      // 未知错误
      throw new DebateError(
        ErrorCodes.INTERNAL_ERROR,
        '服务器内部错误',
        { originalError: error instanceof Error ? error.message : String(error) }
      );
    }
  };
}

/**
 * 验证环境变量是否存在
 */
export function validateApiKey(keyName: string): string {
  const apiKey = process.env[keyName];
  
  if (!apiKey) {
    throw new DebateError(
      ErrorCodes.API_KEY_MISSING,
      `缺少必要的API密钥: ${keyName}`,
      { keyName }
    );
  }
  
  return apiKey;
}

/**
 * 安全地获取环境变量
 */
export function getEnvVar(name: string, defaultValue?: string): string {
  const value = process.env[name];
  
  if (!value && defaultValue === undefined) {
    throw new DebateError(
      ErrorCodes.MISSING_PARAMETERS,
      `缺少必要的环境变量: ${name}`,
      { envVar: name }
    );
  }
  
  return value || defaultValue || '';
}

/**
 * 格式化错误响应
 */
export function formatErrorResponse(error: Error | DebateError) {
  if (error instanceof DebateError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp: error.timestamp,
      }
    };
  }
  
  return {
    success: false,
    error: {
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message || '未知错误',
      timestamp: Date.now(),
    }
  };
}

/**
 * 验证请求参数
 */
export function validateRequiredParams(
  params: Record<string, any>,
  requiredFields: string[]
): void {
  const missingFields = requiredFields.filter(field => {
    const value = params[field];
    return value === undefined || value === null || value === '';
  });
  
  if (missingFields.length > 0) {
    throw new DebateError(
      ErrorCodes.MISSING_PARAMETERS,
      `缺少必要参数: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

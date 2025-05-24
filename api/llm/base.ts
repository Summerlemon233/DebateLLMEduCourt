// LLM客户端基类
import type { LLMClient, LLMCallOptions, LLMResponse } from '@/types';
import { DebateError, ErrorCodes } from '../utils/error-handler';
import { withRetry, withTimeout, DEFAULT_RETRY_OPTIONS } from '../utils/retry';

export interface BaseLLMConfig {
  modelId: string;
  modelName: string;
  apiKey: string;
  baseURL?: string;
  defaultOptions: LLMCallOptions;
  timeout: number;
}

/**
 * LLM客户端抽象基类
 * 提供通用的错误处理、重试、超时等功能
 */
export abstract class BaseLLMClient implements LLMClient {
  protected config: BaseLLMConfig;

  constructor(config: BaseLLMConfig) {
    this.config = config;
  }

  get modelId(): string {
    return this.config.modelId;
  }

  /**
   * 抽象方法：子类需要实现具体的API调用逻辑
   */
  protected abstract callAPI(prompt: string, options: LLMCallOptions): Promise<string>;

  /**
   * 检查服务是否可用
   */
  abstract isAvailable(): boolean;

  /**
   * 主要调用方法，包含错误处理和重试逻辑
   */
  async call(prompt: string, options: LLMCallOptions = {}): Promise<LLMResponse> {
    const startTime = Date.now();
    const mergedOptions = { ...this.config.defaultOptions, ...options };

    try {
      // 验证输入
      this.validateInput(prompt, mergedOptions);

      // 带超时和重试的API调用
      const content = await withRetry(
        () => withTimeout(
          this.callAPI(prompt, mergedOptions),
          mergedOptions.timeout || this.config.timeout,
          `${this.config.modelName} 调用超时`
        ),
        {
          ...DEFAULT_RETRY_OPTIONS,
          maxRetries: 2, // LLM调用重试次数较少
        }
      );

      // 验证响应
      this.validateResponse(content);

      return {
        model: this.config.modelId,
        content: content.trim(),
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };

    } catch (error) {
      console.error(`${this.config.modelName} 调用失败:`, error);

      return {
        model: this.config.modelId,
        content: '',
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 验证输入参数
   */
  protected validateInput(prompt: string, options: LLMCallOptions): void {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new DebateError(
        ErrorCodes.INVALID_REQUEST,
        '提示词不能为空',
        { modelId: this.config.modelId }
      );
    }

    if (prompt.length > 10000) {
      throw new DebateError(
        ErrorCodes.INVALID_REQUEST,
        '提示词过长，请缩短后重试',
        { modelId: this.config.modelId, length: prompt.length }
      );
    }

    if (options.maxTokens && (options.maxTokens < 1 || options.maxTokens > 8192)) {
      throw new DebateError(
        ErrorCodes.INVALID_REQUEST,
        'maxTokens 参数应在 1-8192 之间',
        { modelId: this.config.modelId, maxTokens: options.maxTokens }
      );
    }

    if (options.temperature && (options.temperature < 0 || options.temperature > 2)) {
      throw new DebateError(
        ErrorCodes.INVALID_REQUEST,
        'temperature 参数应在 0-2 之间',
        { modelId: this.config.modelId, temperature: options.temperature }
      );
    }
  }

  /**
   * 验证API响应
   */
  protected validateResponse(content: string): void {
    if (!content || typeof content !== 'string') {
      throw new DebateError(
        ErrorCodes.MODEL_RESPONSE_EMPTY,
        `${this.config.modelName} 返回了空响应`,
        { modelId: this.config.modelId }
      );
    }

    if (content.trim().length === 0) {
      throw new DebateError(
        ErrorCodes.MODEL_RESPONSE_EMPTY,
        `${this.config.modelName} 返回了空白响应`,
        { modelId: this.config.modelId }
      );
    }

    // 检查是否是错误响应
    const lowerContent = content.toLowerCase();
    const errorKeywords = ['error', 'failed', 'unauthorized', 'forbidden', 'invalid'];
    if (errorKeywords.some(keyword => lowerContent.includes(keyword)) && content.length < 100) {
      console.warn(`${this.config.modelName} 可能返回了错误响应:`, content);
    }
  }

  /**
   * 格式化错误信息
   */
  protected formatError(error: any, context: string): Error {
    if (error instanceof DebateError) {
      return error;
    }

    // HTTP错误处理
    if (error.response) {
      const status = error.response.status;
      const statusText = error.response.statusText || '';
      
      switch (status) {
        case 401:
          return new DebateError(
            ErrorCodes.API_KEY_INVALID,
            `${this.config.modelName} API密钥无效`,
            { modelId: this.config.modelId, status }
          );
        case 403:
          return new DebateError(
            ErrorCodes.API_KEY_INVALID,
            `${this.config.modelName} 访问被拒绝，请检查API密钥权限`,
            { modelId: this.config.modelId, status }
          );
        case 429:
          return new DebateError(
            ErrorCodes.API_RATE_LIMIT,
            `${this.config.modelName} 请求频率过高`,
            { modelId: this.config.modelId, status }
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new DebateError(
            ErrorCodes.SERVICE_UNAVAILABLE,
            `${this.config.modelName} 服务暂不可用`,
            { modelId: this.config.modelId, status }
          );
        default:
          return new DebateError(
            ErrorCodes.API_RESPONSE_ERROR,
            `${this.config.modelName} API错误: ${status} ${statusText}`,
            { modelId: this.config.modelId, status }
          );
      }
    }

    // 网络错误处理
    if (error.code) {
      switch (error.code) {
        case 'ECONNABORTED':
        case 'ETIMEDOUT':
          return new DebateError(
            ErrorCodes.API_TIMEOUT,
            `${this.config.modelName} 请求超时`,
            { modelId: this.config.modelId, code: error.code }
          );
        case 'ENOTFOUND':
        case 'ECONNREFUSED':
          return new DebateError(
            ErrorCodes.API_NETWORK_ERROR,
            `${this.config.modelName} 网络连接失败`,
            { modelId: this.config.modelId, code: error.code }
          );
      }
    }

    // 通用错误
    return new DebateError(
      ErrorCodes.MODEL_UNAVAILABLE,
      `${this.config.modelName} ${context}: ${error.message || String(error)}`,
      { modelId: this.config.modelId, originalError: error }
    );
  }

  /**
   * 构建标准化的请求头
   */
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'DebateLLMEduCourt/1.0',
      'Accept': 'application/json',
    };
  }

  /**
   * 日志记录方法
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${this.config.modelName}] ${message}`;
    
    switch (level) {
      case 'info':
        console.log(logMessage, data);
        break;
      case 'warn':
        console.warn(logMessage, data);
        break;
      case 'error':
        console.error(logMessage, data);
        break;
    }
  }

  /**
   * 生成响应方法 - 为了兼容现有实现
   */
  async generateResponse(prompt: string, config?: any): Promise<LLMResponse> {
    return this.call(prompt, config);
  }

  /**
   * 健康检查方法
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.call('Hello', { maxTokens: 10 });
      return response.content.length > 0;
    } catch (error) {
      this.log('warn', 'Health check failed', error);
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): { id: string; name: string; provider: string; available: boolean } {
    return {
      id: this.config.modelId,
      name: this.config.modelName,
      provider: this.constructor.name.replace('Client', ''),
      available: this.isAvailable()
    };
  }
}

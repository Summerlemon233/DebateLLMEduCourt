// DeepSeek API客户端
import axios, { AxiosInstance } from 'axios';
import { BaseLLMClient, BaseLLMConfig } from './base';
import { validateApiKey, getEnvVar } from '../utils/error-handler';
import type { LLMCallOptions } from '@/types';

interface DeepSeekConfig extends BaseLLMConfig {
  model?: string;
}

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface DeepSeekResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * DeepSeek API客户端
 */
export class DeepSeekClient extends BaseLLMClient {
  private client: AxiosInstance;
  private model: string;

  constructor(config?: Partial<DeepSeekConfig>) {
    const apiKey = validateApiKey('DEEPSEEK_API_KEY');
    const baseURL = getEnvVar('DEEPSEEK_BASE_URL', 'https://api.deepseek.com');
    
    const fullConfig: BaseLLMConfig = {
      modelId: 'deepseek',
      modelName: 'DeepSeek',
      apiKey,
      baseURL,
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.95,
        timeout: 60000,
      },
      timeout: 60000,
      ...config,
    };

    super(fullConfig);
    
    this.model = (config as DeepSeekConfig)?.model || 'deepseek-chat';
    
    // 创建axios实例
    this.client = axios.create({
      baseURL: `${baseURL}/v1`,
      timeout: fullConfig.timeout,
      headers: {
        ...this.getDefaultHeaders(),
        'Authorization': `Bearer ${apiKey}`,
      },
    });
  }

  /**
   * 检查服务是否可用
   */
  isAvailable(): boolean {
    try {
      return !!this.config.apiKey && this.config.apiKey.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * 调用DeepSeek API
   */
  protected async callAPI(prompt: string, options: LLMCallOptions): Promise<string> {
    try {
      this.log('info', '开始调用DeepSeek API', { 
        promptLength: prompt.length,
        model: this.model,
        options 
      });

      const messages: DeepSeekMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const requestData: DeepSeekRequest = {
        model: this.model,
        messages,
        temperature: options.temperature || this.config.defaultOptions.temperature,
        max_tokens: options.maxTokens || this.config.defaultOptions.maxTokens,
        top_p: options.topP || this.config.defaultOptions.topP,
        stream: false,
      };

      this.log('info', 'DeepSeek请求数据', { requestData });

      const response = await this.client.post<DeepSeekResponse>('/chat/completions', requestData);

      if (!response.data || !response.data.choices || response.data.choices.length === 0) {
        throw new Error('DeepSeek返回无效响应结构');
      }

      const choice = response.data.choices[0];
      if (!choice.message || !choice.message.content) {
        throw new Error('DeepSeek返回空内容');
      }

      const content = choice.message.content;

      this.log('info', 'DeepSeek API调用成功', { 
        responseLength: content.length,
        finishReason: choice.finish_reason,
        usage: response.data.usage
      });

      return content;

    } catch (error) {
      this.log('error', 'DeepSeek API调用失败', error);
      throw this.formatError(error, 'API调用失败');
    }
  }

  /**
   * 获取可用的模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      // DeepSeek当前可用的模型
      return [
        'deepseek-chat',
        'deepseek-coder',
      ];
    } catch (error) {
      this.log('error', '获取DeepSeek模型列表失败', error);
      return ['deepseek-chat'];
    }
  }

  /**
   * 测试API连接
   */
  async testConnection(): Promise<boolean> {
    try {
      const testPrompt = '请回复"测试成功"';
      const response = await this.callAPI(testPrompt, { maxTokens: 10 });
      return response.includes('测试成功') || response.length > 0;
    } catch (error) {
      this.log('error', 'DeepSeek连接测试失败', error);
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo() {
    return {
      id: this.config.modelId,
      name: this.config.modelName,
      provider: 'DeepSeek',
      available: this.isAvailable()
    };
  }
}

/**
 * 创建DeepSeek客户端实例
 */
export function createDeepSeekClient(config?: Partial<DeepSeekConfig>): DeepSeekClient {
  return new DeepSeekClient(config);
}

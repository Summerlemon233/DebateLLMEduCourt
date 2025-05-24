// Qwen (通义千问) API客户端
import axios, { AxiosInstance } from 'axios';
import { BaseLLMClient, BaseLLMConfig } from './base';
import { validateApiKey, getEnvVar } from '../utils/error-handler';
import type { LLMCallOptions } from '@/types';

interface QwenConfig extends BaseLLMConfig {
  model?: string;
}

interface QwenMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface QwenRequest {
  model: string;
  input: {
    messages: QwenMessage[];
  };
  parameters?: {
    temperature?: number;
    max_tokens?: number;
    top_p?: number;
    result_format?: string;
  };
}

interface QwenResponse {
  output: {
    text?: string;
    choices?: Array<{
      message: {
        role: string;
        content: string;
      };
      finish_reason: string;
    }>;
  };
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  request_id: string;
}

/**
 * Qwen (阿里云通义千问) API客户端
 */
export class QwenClient extends BaseLLMClient {
  private client: AxiosInstance;
  private model: string;

  constructor(config?: Partial<QwenConfig>) {
    const apiKey = validateApiKey('QWEN_API_KEY');
    const baseURL = getEnvVar('QWEN_BASE_URL', 'https://dashscope.aliyuncs.com/api/v1');
    
    const fullConfig: BaseLLMConfig = {
      modelId: 'qwen',
      modelName: 'Qwen (通义千问)',
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
    
    this.model = (config as QwenConfig)?.model || 'qwen-turbo';
    
    // 创建axios实例
    this.client = axios.create({
      baseURL,
      timeout: fullConfig.timeout,
      headers: {
        ...this.getDefaultHeaders(),
        'Authorization': `Bearer ${apiKey}`,
        'X-DashScope-SSE': 'disable', // 禁用SSE
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
   * 调用Qwen API
   */
  protected async callAPI(prompt: string, options: LLMCallOptions): Promise<string> {
    try {
      this.log('info', '开始调用Qwen API', { 
        promptLength: prompt.length,
        model: this.model,
        options 
      });

      const messages: QwenMessage[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const requestData: QwenRequest = {
        model: this.model,
        input: {
          messages,
        },
        parameters: {
          temperature: options.temperature || this.config.defaultOptions.temperature,
          max_tokens: options.maxTokens || this.config.defaultOptions.maxTokens,
          top_p: options.topP || this.config.defaultOptions.topP,
          result_format: 'message',
        },
      };

      this.log('info', 'Qwen请求数据', { requestData });

      const response = await this.client.post<QwenResponse>('/services/aigc/text-generation/generation', requestData);

      if (!response.data || !response.data.output) {
        throw new Error('Qwen返回无效响应结构');
      }

      let content: string;

      // 检查不同的响应格式
      if (response.data.output.choices && response.data.output.choices.length > 0) {
        const choice = response.data.output.choices[0];
        if (!choice.message || !choice.message.content) {
          throw new Error('Qwen返回空内容');
        }
        content = choice.message.content;
      } else if (response.data.output.text) {
        content = response.data.output.text;
      } else {
        throw new Error('Qwen返回未知响应格式');
      }

      this.log('info', 'Qwen API调用成功', { 
        responseLength: content.length,
        usage: response.data.usage,
        requestId: response.data.request_id
      });

      return content;

    } catch (error) {
      this.log('error', 'Qwen API调用失败', error);
      throw this.formatError(error, 'API调用失败');
    }
  }

  /**
   * 获取可用的模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      // Qwen当前可用的模型
      return [
        'qwen-turbo',
        'qwen-plus',
        'qwen-max',
        'qwen-max-longcontext',
      ];
    } catch (error) {
      this.log('error', '获取Qwen模型列表失败', error);
      return ['qwen-turbo'];
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
      this.log('error', 'Qwen连接测试失败', error);
      return false;
    }
  }

  /**
   * 设置模型
   */
  setModel(model: string): void {
    this.model = model;
    this.log('info', `切换到模型: ${model}`);
  }

  /**
   * 获取当前模型
   */
  getCurrentModel(): string {
    return this.model;
  }
}

/**
 * 创建Qwen客户端实例
 */
export function createQwenClient(config?: Partial<QwenConfig>): QwenClient {
  return new QwenClient(config);
}

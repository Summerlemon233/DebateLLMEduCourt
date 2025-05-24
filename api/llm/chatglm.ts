import { BaseLLMClient } from './base';
import { LLMResponse, ModelConfig } from '../../src/types';
import { DebateError } from '../utils/error-handler';
import { retryWithBackoff } from '../utils/retry';

interface ChatGLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatGLMRequest {
  model: string;
  messages: ChatGLMMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
}

interface ChatGLMResponse {
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

export class ChatGLMClient extends BaseLLMClient {
  constructor(apiKey: string) {
    super({
      modelId: 'chatglm',
      modelName: 'ChatGLM',
      apiKey,
      baseURL: 'https://open.bigmodel.cn/api/paas/v4',
      defaultOptions: {
        maxTokens: 4096,
        temperature: 0.7,
      },
      timeout: 30000,
    });
  }

  protected async callAPI(prompt: string, options: any): Promise<string> {
    const startTime = Date.now();
    try {
      const response = await retryWithBackoff(
        async () => this.makeRequest(prompt, options),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        }
      );

      return response.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('ChatGLM API request failed:', error);
      throw error;
    }
  }

  async generateResponse(prompt: string, options: any = {}): Promise<LLMResponse> {
    const startTime = Date.now();
    try {
      const response = await retryWithBackoff(
        async () => this.makeRequest(prompt, options),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        }
      );

      return {
        model: this.config.modelName,
        content: response.choices[0]?.message?.content || '',
        timestamp: new Date().toISOString(),
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0
        },
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('ChatGLM API request failed:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.config.apiKey;
  }

  private async makeRequest(
    prompt: string,
    options: any
  ): Promise<ChatGLMResponse> {
    const requestBody: ChatGLMRequest = {
      model: options.model || 'glm-4',
      messages: [
        {
          role: 'system',
          content: '你是一个专业的辩论助手，请提供有逻辑性和说服力的观点。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 2000,
      top_p: options.topP || 0.9,
      stream: false
    };

    const response = await fetch(`${this.config.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DebateError(
        `ChatGLM API error: ${response.status}`,
        'API_ERROR',
        { 
          response: errorData,
          url: `${this.config.baseURL}/chat/completions`,
          model: requestBody.model
        }
      );
    }

    const data = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new DebateError(
        'No choices returned from ChatGLM API',
        'INVALID_RESPONSE',
        { response: data }
      );
    }

    return data;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.generateResponse(
        '请回答：健康检查测试',
        { maxTokens: 50 }
      );
      return testResponse.content.length > 0;
    } catch (error) {
      console.error('ChatGLM health check failed:', error);
      return false;
    }
  }

  getModelInfo() {
    return {
      id: this.config.modelId,
      name: this.config.modelName,
      provider: 'Zhipu AI',
      available: this.isAvailable()
    };
  }
}

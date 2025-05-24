import { BaseLLMClient, BaseLLMConfig } from './base';
import { LLMResponse, LLMCallOptions } from '@/types';
import { DebateError, ErrorCodes } from '../utils/error-handler';

interface HunyuanConfig {
  apiKey: string;
  baseURL?: string;
  model?: string;
}

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIRequest {
  model: string;
  messages: OpenAIMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string[];
  extra_body?: Record<string, any>;
}

interface OpenAIChoice {
  index: number;
  message: {
    role: string;
    content: string;
  };
  finish_reason: string;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: OpenAIChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  note?: string;
}

export class HunyuanClient extends BaseLLMClient {
  private apiKey: string;
  private baseURL: string;
  private model: string;

  constructor(config: HunyuanConfig) {
    const baseLLMConfig: BaseLLMConfig = {
      modelId: 'hunyuan',
      modelName: 'Tencent Hunyuan',
      apiKey: config.apiKey,
      baseURL: config.baseURL || 'https://api.hunyuan.cloud.tencent.com/v1',
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 4096,
      },
      timeout: 30000,
    };

    super(baseLLMConfig);
    this.apiKey = config.apiKey;
    this.baseURL = config.baseURL || 'https://api.hunyuan.cloud.tencent.com/v1';
    this.model = config.model || 'hunyuan-turbos-latest';
  }

  protected async callAPI(prompt: string, options: LLMCallOptions): Promise<string> {
    const messages: OpenAIMessage[] = [
      { role: 'user', content: prompt }
    ];

    const requestBody: OpenAIRequest = {
      model: this.model,
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4096,
      top_p: options.topP || 1.0,
      stream: false,
      extra_body: {
        enable_enhancement: true
      }
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DebateError(
        ErrorCodes.API_RESPONSE_ERROR,
        `Hunyuan API error: ${response.status} ${response.statusText}`,
        { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText,
          model: this.model 
        }
      );
    }

    const data: OpenAIResponse = await response.json();
    
    if (!data.choices || data.choices.length === 0) {
      throw new DebateError(
        ErrorCodes.MODEL_RESPONSE_EMPTY,
        'No response choices returned from Hunyuan API',
        { data }
      );
    }

    return data.choices[0].message.content;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  // 兼容旧接口的方法
  async generateResponse(prompt: string, systemMessage?: string): Promise<LLMResponse> {
    let fullPrompt = prompt;
    if (systemMessage) {
      fullPrompt = `${systemMessage}\n\n${prompt}`;
    }
    
    return this.call(fullPrompt);
  }

  async generateStreamResponse(
    prompt: string,
    systemMessage?: string,
    onToken?: (token: string) => void
  ): Promise<string> {
    const messages: OpenAIMessage[] = [];
    
    if (systemMessage) {
      messages.push({ role: 'system', content: systemMessage });
    }
    
    messages.push({ role: 'user', content: prompt });

    const requestBody: OpenAIRequest = {
      model: this.model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: true,
      extra_body: {
        enable_enhancement: true
      }
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new DebateError(
        ErrorCodes.API_RESPONSE_ERROR,
        `Hunyuan API error: ${response.status} ${response.statusText}`,
        { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText,
          model: this.model 
        }
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new DebateError(
        ErrorCodes.API_RESPONSE_ERROR,
        'Response body is not readable'
      );
    }

    let fullResponse = '';
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              return fullResponse;
            }

            try {
              const parsed = JSON.parse(data);
              if (parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content) {
                const token = parsed.choices[0].delta.content;
                fullResponse += token;
                if (onToken) {
                  onToken(token);
                }
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
              continue;
            }
          }
        }
      }

      return fullResponse;
    } finally {
      reader.releaseLock();
    }
  }

  getModelInfo() {
    return {
      id: this.config.modelId,
      name: this.config.modelName,
      provider: 'Tencent',
      available: this.isAvailable(),
      baseURL: this.baseURL,
      model: this.model,
      supportStream: true,
      supportSystem: true,
      maxTokens: 4096,
      description: 'Tencent Hunyuan large language model using OpenAI-compatible API format'
    };
  }

  // 静态方法用于从环境变量创建实例
  static fromEnv(): HunyuanClient | null {
    const apiKey = process.env.HUNYUAN_API_KEY;
    
    if (!apiKey) {
      return null;
    }

    return new HunyuanClient({
      apiKey,
      baseURL: process.env.HUNYUAN_BASE_URL || 'https://api.hunyuan.cloud.tencent.com/v1',
      model: process.env.HUNYUAN_DEFAULT_MODEL || 'hunyuan-turbos-latest'
    });
  }
}

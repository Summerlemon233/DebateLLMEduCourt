import { BaseLLMClient } from './base';
import { LLMResponse, ModelConfig } from '../../src/types';
import { DebateError } from '../utils/error-handler';
import { retryWithBackoff } from '../utils/retry';
import crypto from 'crypto';

interface HunyuanMessage {
  Role: 'system' | 'user' | 'assistant';
  Content: string;
}

interface HunyuanRequest {
  Model: string;
  Messages: HunyuanMessage[];
  Temperature?: number;
  TopP?: number;
  Stream?: boolean;
}

interface HunyuanResponse {
  Response: {
    Choices: Array<{
      Message: {
        Role: string;
        Content: string;
      };
      FinishReason: string;
    }>;
    Usage: {
      PromptTokens: number;
      CompletionTokens: number;
      TotalTokens: number;
    };
    RequestId: string;
  };
}

export class HunyuanClient extends BaseLLMClient {
  private secretId: string;
  private secretKey: string;
  private region: string;

  constructor(secretId: string, secretKey: string, region: string = 'ap-beijing') {
    super({
      modelId: 'hunyuan',
      modelName: 'Hunyuan',
      apiKey: secretId, // Store secretId as apiKey for availability check
      baseURL: 'https://hunyuan.tencentcloudapi.com',
      defaultOptions: {
        maxTokens: 4096,
        temperature: 0.7,
      },
      timeout: 30000,
    });
    this.secretId = secretId;
    this.secretKey = secretKey;
    this.region = region;
  }

  protected async callAPI(prompt: string, options: any): Promise<string> {
    try {
      const response = await retryWithBackoff(
        async () => this.makeRequest(prompt, options),
        {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        }
      );

      return response.Response.Choices[0]?.Message?.Content || '';
    } catch (error) {
      console.error('Hunyuan API request failed:', error);
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
        content: response.Response.Choices[0]?.Message?.Content || '',
        timestamp: new Date().toISOString(),
        usage: {
          promptTokens: response.Response.Usage?.PromptTokens || 0,
          completionTokens: response.Response.Usage?.CompletionTokens || 0,
          totalTokens: response.Response.Usage?.TotalTokens || 0
        },
        responseTime: Date.now() - startTime
      };
    } catch (error) {
      console.error('Hunyuan API request failed:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!(this.secretId && this.secretKey);
  }

  private async makeRequest(
    prompt: string,
    options: any
  ): Promise<HunyuanResponse> {
    const requestBody: HunyuanRequest = {
      Model: options.model || 'hunyuan-lite',
      Messages: [
        {
          Role: 'system',
          Content: '你是一个专业的辩论助手，请提供有逻辑性和说服力的观点。'
        },
        {
          Role: 'user',
          Content: prompt
        }
      ],
      Temperature: options.temperature || 0.7,
      TopP: options.topP || 0.9,
      Stream: false
    };

    // 腾讯云API需要签名，这里简化处理
    // 实际项目中需要实现完整的腾讯云API v3签名算法
    const headers = await this.generateHeaders(requestBody);

    const response = await fetch(this.config.baseURL || 'https://hunyuan.tencentcloudapi.com', {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new DebateError(
        `Hunyuan API error: ${response.status}`,
        'API_ERROR',
        { 
          response: errorData,
          url: this.config.baseURL,
          model: requestBody.Model
        }
      );
    }

    const data = await response.json();
    
    if (!data.Response || !data.Response.Choices || data.Response.Choices.length === 0) {
      throw new DebateError(
        'No choices returned from Hunyuan API',
        'INVALID_RESPONSE',
        { response: data }
      );
    }

    return data;
  }

  private async generateHeaders(requestBody: HunyuanRequest): Promise<Record<string, string>> {
    // 简化的腾讯云API签名实现
    // 实际项目中需要完整实现腾讯云API v3签名算法
    const timestamp = Math.floor(Date.now() / 1000).toString();
    
    return {
      'Content-Type': 'application/json',
      'X-TC-Action': 'ChatCompletions',
      'X-TC-Version': '2023-09-01',
      'X-TC-Region': this.region,
      'X-TC-Timestamp': timestamp,
      'Authorization': this.generateAuthorizationHeader(requestBody, timestamp)
    };
  }

  private generateAuthorizationHeader(requestBody: HunyuanRequest, timestamp: string): string {
    // 这是一个简化的实现，实际需要完整的腾讯云签名算法
    // 包括：计算规范请求、创建待签名字符串、计算签名等步骤
    const payload = JSON.stringify(requestBody);
    const payloadHash = crypto.createHash('sha256').update(payload).digest('hex');
    
    // 简化的签名（实际项目中需要完整实现）
    const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${payloadHash}`;
    const signature = crypto.createHmac('sha256', this.secretKey).update(stringToSign).digest('hex');
    
    return `TC3-HMAC-SHA256 Credential=${this.secretId}/${timestamp}, SignedHeaders=content-type;host;x-tc-action, Signature=${signature}`;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const testResponse = await this.generateResponse(
        '请回答：健康检查测试',
        { maxTokens: 50 }
      );
      return testResponse.content.length > 0;
    } catch (error) {
      console.error('Hunyuan health check failed:', error);
      return false;
    }
  }

  getModelInfo() {
    return {
      id: this.config.modelId,
      name: this.config.modelName,
      provider: 'Tencent',
      available: this.isAvailable()
    };
  }
}

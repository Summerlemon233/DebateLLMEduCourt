// Google Gemini API客户端
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { BaseLLMClient, BaseLLMConfig } from './base';
import { validateApiKey } from '../utils/error-handler';
import type { LLMCallOptions } from '@/types';

interface GeminiConfig extends Omit<BaseLLMConfig, 'baseURL'> {
  model?: string;
}

/**
 * Google Gemini API客户端
 */
export class GeminiClient extends BaseLLMClient {
  private genAI: GoogleGenerativeAI;
  private modelName: string;

  constructor(config?: Partial<GeminiConfig>) {
    const apiKey = validateApiKey('GEMINI_API_KEY');
    
    const fullConfig: BaseLLMConfig = {
      modelId: 'gemini',
      modelName: 'Google Gemini',
      apiKey,
      defaultOptions: {
        temperature: 0.7,
        maxTokens: 4096,
        topP: 0.95,
        timeout: 60000, // 60秒
      },
      timeout: 60000,
      ...config,
    };

    super(fullConfig);
    
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = (config as GeminiConfig)?.model || process.env.GEMINI_DEFAULT_MODEL || 'gemini-1.5-flash';
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
   * 调用Gemini API
   */
  protected async callAPI(prompt: string, options: LLMCallOptions): Promise<string> {
    try {
      this.log('info', '开始调用Gemini API', { 
        promptLength: prompt.length,
        options 
      });

      // 获取模型实例
      const model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: options.temperature || this.config.defaultOptions.temperature,
          maxOutputTokens: options.maxTokens || this.config.defaultOptions.maxTokens,
          topP: options.topP || this.config.defaultOptions.topP,
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
          },
        ],
      });

      // 发送请求
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      // 检查响应状态
      if (!response) {
        throw new Error('Gemini返回空响应');
      }

      // 获取文本内容
      const text = response.text();
      
      if (!text) {
        // 检查是否被安全过滤器阻止
        if (response.candidates && response.candidates[0]?.finishReason) {
          const finishReason = response.candidates[0].finishReason;
          if (finishReason === 'SAFETY') {
            throw new Error('响应被安全过滤器阻止，请尝试调整问题内容');
          } else if (finishReason === 'RECITATION') {
            throw new Error('响应可能包含版权内容被阻止');
          }
        }
        throw new Error('Gemini返回空文本内容');
      }

      this.log('info', 'Gemini API调用成功', { 
        responseLength: text.length,
        finishReason: response.candidates?.[0]?.finishReason
      });

      return text;

    } catch (error) {
      this.log('error', 'Gemini API调用失败', error);
      throw this.formatError(error, 'API调用失败');
    }
  }

  /**
   * 获取可用的模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      // Gemini当前可用的模型
      return [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-1.0-pro',
      ];
    } catch (error) {
      this.log('error', '获取Gemini模型列表失败', error);
      return ['gemini-1.5-flash']; // 返回默认模型
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
      this.log('error', 'Gemini连接测试失败', error);
      return false;
    }
  }
}

/**
 * 创建Gemini客户端实例
 */
export function createGeminiClient(config?: Partial<GeminiConfig>): GeminiClient {
  return new GeminiClient(config);
}

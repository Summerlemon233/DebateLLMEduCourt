import { BaseLLMClient } from './base';
import { DeepSeekClient } from './deepseek';
import { QwenClient } from './qwen';
import { DoubaoClient } from './doubao';
import { ChatGLMClient } from './chatglm';
import { HunyuanClient } from './hunyuan_new';
import { DebateError } from '../utils/error-handler';

export type LLMProvider = 'deepseek' | 'qwen' | 'doubao' | 'chatglm' | 'hunyuan';

interface LLMConfig {
  deepseek?: string;
  qwen?: string;
  doubao?: string;
  chatglm?: string;
  hunyuan?: string;
}

export class LLMFactory {
  private clients: Map<LLMProvider, BaseLLMClient> = new Map();
  private config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
    this.initializeClients();
  }

  private initializeClients(): void {
    try {
      // DeepSeek
      if (this.config.deepseek) {
        this.clients.set('deepseek', new DeepSeekClient({ apiKey: this.config.deepseek }));
      }

      // Qwen
      if (this.config.qwen) {
        this.clients.set('qwen', new QwenClient({ apiKey: this.config.qwen }));
      }

      // Doubao
      if (this.config.doubao) {
        this.clients.set('doubao', new DoubaoClient(this.config.doubao));
      }

      // ChatGLM
      if (this.config.chatglm) {
        this.clients.set('chatglm', new ChatGLMClient(this.config.chatglm));
      }

      // Hunyuan
      if (this.config.hunyuan) {
        this.clients.set('hunyuan', new HunyuanClient({
          apiKey: this.config.hunyuan,
          baseURL: process.env.HUNYUAN_BASE_URL || 'https://api.hunyuan.cloud.tencent.com/v1',
          model: process.env.HUNYUAN_DEFAULT_MODEL || 'hunyuan-turbos-latest'
        }));
      }
    } catch (error) {
      throw new DebateError(
        'Failed to initialize LLM clients',
        'INITIALIZATION_ERROR',
        { error: error instanceof Error ? error.message : String(error) }
      );
    }
  }

  getClient(provider: LLMProvider): BaseLLMClient {
    const client = this.clients.get(provider);
    if (!client) {
      throw new DebateError(
        `LLM client not found or not configured: ${provider}`,
        'CLIENT_NOT_FOUND',
        { provider, availableProviders: Array.from(this.clients.keys()) }
      );
    }
    return client;
  }

  getAvailableProviders(): LLMProvider[] {
    return Array.from(this.clients.keys());
  }

  async healthCheckAll(): Promise<Record<LLMProvider, boolean>> {
    const results: Record<string, boolean> = {};
    
    const healthCheckPromises = Array.from(this.clients.entries()).map(
      async ([provider, client]) => {
        try {
          const isHealthy = await client.healthCheck();
          results[provider] = isHealthy;
        } catch (error) {
          console.error(`Health check failed for ${provider}:`, error);
          results[provider] = false;
        }
      }
    );

    await Promise.allSettled(healthCheckPromises);
    return results as Record<LLMProvider, boolean>;
  }

  async healthCheck(provider: LLMProvider): Promise<boolean> {
    const client = this.getClient(provider);
    return await client.healthCheck();
  }

  getAllModelInfo() {
    const modelInfo: Record<string, any> = {};
    
    this.clients.forEach((client, provider) => {
      modelInfo[provider] = client.getModelInfo();
    });

    return modelInfo;
  }

  getModelInfo(provider: LLMProvider) {
    const client = this.getClient(provider);
    return client.getModelInfo();
  }

  static createFromEnv(): LLMFactory {
    const config: LLMConfig = {};

    // 从环境变量读取API密钥
    if (process.env.DEEPSEEK_API_KEY) {
      config.deepseek = process.env.DEEPSEEK_API_KEY;
    }

    if (process.env.QWEN_API_KEY) {
      config.qwen = process.env.QWEN_API_KEY;
    }

    if (process.env.DOUBAO_API_KEY) {
      config.doubao = process.env.DOUBAO_API_KEY;
    }

    if (process.env.CHATGLM_API_KEY) {
      config.chatglm = process.env.CHATGLM_API_KEY;
    }

    if (process.env.HUNYUAN_API_KEY) {
      config.hunyuan = process.env.HUNYUAN_API_KEY;
    }

    return new LLMFactory(config);
  }
}

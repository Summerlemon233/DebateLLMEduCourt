import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMFactory, LLMProvider } from '../../api/llm/factory';
import { DebateError } from '../../api/utils/error-handler';

// 创建全局LLM工厂实例
let llmFactory: LLMFactory | null = null;

function getLLMFactory(): LLMFactory {
  if (!llmFactory) {
    llmFactory = LLMFactory.createFromEnv();
  }
  return llmFactory;
}

interface TestResponse {
  success: boolean;
  data?: {
    model: string;
    response: string;
    responseTime: number;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TestResponse>
) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const { model, prompt } = req.body;

    if (!model || !prompt) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: model and prompt',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 验证模型是否支持
    const factory = getLLMFactory();
    const availableModels = factory.getAvailableProviders();
    
    if (!availableModels.includes(model as LLMProvider)) {
      res.status(400).json({
        success: false,
        error: `Model not available: ${model}. Available models: ${availableModels.join(', ')}`,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 获取客户端并发送请求
    const client = factory.getClient(model as LLMProvider);
    const startTime = Date.now();
    
    const response = await client.generateResponse(prompt, {
      maxTokens: 500,
      temperature: 0.7
    });

    const responseTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      data: {
        model: response.model,
        response: response.content,
        responseTime,
        usage: response.usage
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test API error:', error);

    if (error instanceof DebateError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

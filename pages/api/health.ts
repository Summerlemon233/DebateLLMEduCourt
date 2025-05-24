import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMFactory, LLMProvider } from '../../api/llm/factory';

// 创建全局LLM工厂实例
let llmFactory: LLMFactory | null = null;

function getLLMFactory(): LLMFactory {
  if (!llmFactory) {
    llmFactory = LLMFactory.createFromEnv();
  }
  return llmFactory;
}

interface HealthCheckResponse {
  success: boolean;
  data?: {
    availableModels: LLMProvider[];
    healthStatus: Record<LLMProvider, boolean>;
    modelInfo: Record<string, any>;
  };
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许GET请求
  if (req.method !== 'GET') {
    res.status(405).json({
      success: false,
      error: 'Method not allowed',
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    const factory = getLLMFactory();
    
    // 获取可用模型列表
    const availableModels = factory.getAvailableProviders();
    
    // 执行健康检查
    const healthStatus = await factory.healthCheckAll();
    
    // 获取模型信息
    const modelInfo = factory.getAllModelInfo();

    res.status(200).json({
      success: true,
      data: {
        availableModels,
        healthStatus,
        modelInfo
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check API error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMFactory } from '../../api/llm/factory';
import { EoTEngine, EoTRequest, EoTResponse } from '../../api/eot/engine';
import { DebateError } from '../../api/utils/error-handler';

// 创建全局LLM工厂实例
let llmFactory: LLMFactory | null = null;

function getLLMFactory(): LLMFactory {
  if (!llmFactory) {
    llmFactory = LLMFactory.createFromEnv();
  }
  return llmFactory;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<EoTResponse>
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
    // 验证请求体
    const { question, models, config, eotStrategy }: EoTRequest = req.body;

    if (!question || !models || !eotStrategy) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: question, models, and eotStrategy',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 创建EoT引擎
    const factory = getLLMFactory();
    const eotEngine = new EoTEngine(factory);

    // 执行EoT推理
    const result = await eotEngine.runEoT({
      question,
      models,
      config,
      eotStrategy
    });

    // 返回结果
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('EoT API error:', error);

    if (error instanceof DebateError) {
      res.status(error.statusCode).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

// 配置API路由的最大请求大小和超时时间
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
  maxDuration: 300, // 5分钟超时
}

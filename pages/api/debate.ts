import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMFactory } from '../../api/llm/factory';
import { DebateEngine, DebateRequest, DebateResponse } from '../../api/debate/engine';
import { DebateError } from '../../api/utils/error-handler';

// 创建全局LLM工厂实例（在生产环境中应该使用更好的实例管理）
let llmFactory: LLMFactory | null = null;

function getLLMFactory(): LLMFactory {
  if (!llmFactory) {
    llmFactory = LLMFactory.createFromEnv();
  }
  return llmFactory;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DebateResponse>
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
    const { question, models, config, teacherPersonas }: DebateRequest = req.body;

    if (!question || !models) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: question and models',
        timestamp: new Date().toISOString()
      });
      return;
    }

    console.log('Received teacherPersonas:', teacherPersonas); // 调试日志

    // 创建辩论引擎
    const factory = getLLMFactory();
    const debateEngine = new DebateEngine(factory);

    // 执行辩论
    const result = await debateEngine.runDebate({
      question,
      models,
      config,
      teacherPersonas // 传递教师人格化数据
    });

    // 返回结果
    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(500).json(result);
    }

  } catch (error) {
    console.error('Debate API error:', error);

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

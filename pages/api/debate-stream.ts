import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMFactory } from '../../api/llm/factory';
import { StreamingDebateEngine } from '../../api/debate/streaming-engine';
import { DebateError } from '../../api/utils/error-handler';
import type { DebateRequest } from '../../api/debate/streaming-engine';

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
  res: NextApiResponse
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
    const { question, models, config }: DebateRequest = req.body;

    if (!question || !models) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: question and models',
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 设置SSE头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 创建流式辞论引擎
    const factory = getLLMFactory();
    const streamingEngine = new StreamingDebateEngine(factory);

    // 启动真正的流式辩论
    await streamingEngine.runStreamingDebate({
      question,
      models,
      config
    }, (event) => {
      // 实时发送每个事件
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      console.log('📡 发送流式事件:', event.type, event);
    });

    // 发送完成事件
    res.write(`data: ${JSON.stringify({ type: 'complete' })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Streaming debate API error:', error);

    if (error instanceof DebateError) {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: error.message
      })}\n\n`);
    } else {
      res.write(`data: ${JSON.stringify({
        type: 'error',
        error: 'Internal server error'
      })}\n\n`);
    }
    res.end();
  }
}

// 配置API路由
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: false, // 不限制响应大小（流式响应）
  },
  maxDuration: 300, // 5分钟超时
}

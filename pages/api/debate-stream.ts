import type { NextApiRequest, NextApiResponse } from 'next';
import { DebateEngine } from '../../api/debate/engine';
import { LLMFactory } from '../../api/llm/factory';

interface DebateRequest {
  question: string;
  models: string[];
}

interface SessionData {
  request: DebateRequest;
  timestamp: number;
}

// 临时会话存储
const sessions = new Map<string, SessionData>();

// 清理过期会话 (15分钟)
const cleanupSessions = () => {
  const now = Date.now();
  const timeout = 15 * 60 * 1000; // 15分钟
  
  for (const [sessionId, data] of sessions.entries()) {
    if (now - data.timestamp > timeout) {
      sessions.delete(sessionId);
    }
  }
};

// 每5分钟清理一次过期会话
setInterval(cleanupSessions, 5 * 60 * 1000);

// 创建全局LLM工厂实例
let llmFactory: LLMFactory | null = null;

function getLLMFactory(): LLMFactory {
  if (!llmFactory) {
    llmFactory = LLMFactory.createFromEnv();
  }
  return llmFactory;
}

// 辅助函数：带进度反馈的阶段1执行
async function runStage1WithProgress(
  factory: LLMFactory, 
  question: string, 
  models: string[], 
  sendSSE: Function
) {
  const stage: any = {
    stage: 1,
    title: '初始观点',
    description: '各模型提供对问题的初始观点和分析',
    responses: [] as any[],
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0
  };

  const startTime = Date.now();
  const prompt = generateStage1Prompt(question);
  
  const progressStep = 30 / models.length; // 0-35%的30%分给各模型
  let currentProgress = 5;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    
    sendSSE('message', { 
      type: 'model_start', 
      stage: 1, 
      progress: currentProgress, 
      model, 
      message: `🤖 ${model} 正在思考...` 
    });

    try {
      const client = factory.getClient(model as any);
      const response = await client.generateResponse(prompt);
      
      stage.responses.push(response);
      currentProgress += progressStep;
      
      sendSSE('message', { 
        type: 'model_complete', 
        stage: 1, 
        progress: Math.round(currentProgress), 
        model, 
        message: `✅ ${model} 已完成初始观点` 
      });
      
    } catch (error) {
      console.error(`Model ${model} failed in stage 1:`, error);
      stage.responses.push({
        model,
        content: `错误：${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTime: 0
      });
      
      currentProgress += progressStep;
      sendSSE('message', { 
        type: 'model_error', 
        stage: 1, 
        progress: Math.round(currentProgress), 
        model, 
        message: `❌ ${model} 执行失败` 
      });
    }
  }

  stage.endTime = new Date().toISOString();
  stage.duration = Date.now() - startTime;
  return stage;
}

// 辅助函数：带进度反馈的阶段2执行
async function runStage2WithProgress(
  factory: LLMFactory, 
  question: string, 
  models: string[], 
  stage1: any,
  sendSSE: Function
) {
  const stage: any = {
    stage: 2,
    title: '交叉质疑与完善',
    description: '各模型对其他模型的观点进行质疑、补充和完善',
    responses: [] as any[],
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0
  };

  const startTime = Date.now();
  const prompt = generateStage2Prompt(question, stage1);
  
  const progressStep = 30 / models.length; // 35-70%的35%分给各模型
  let currentProgress = 40;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    
    sendSSE('message', { 
      type: 'model_start', 
      stage: 2, 
      progress: currentProgress, 
      model, 
      message: `🔍 ${model} 正在分析其他观点...` 
    });

    try {
      const client = factory.getClient(model as any);
      const response = await client.generateResponse(prompt);
      
      stage.responses.push(response);
      currentProgress += progressStep;
      
      sendSSE('message', { 
        type: 'model_complete', 
        stage: 2, 
        progress: Math.round(currentProgress), 
        model, 
        message: `✅ ${model} 已完成观点完善` 
      });
      
    } catch (error) {
      console.error(`Model ${model} failed in stage 2:`, error);
      stage.responses.push({
        model,
        content: `错误：${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTime: 0
      });
      
      currentProgress += progressStep;
      sendSSE('message', { 
        type: 'model_error', 
        stage: 2, 
        progress: Math.round(currentProgress), 
        model, 
        message: `❌ ${model} 执行失败` 
      });
    }
  }

  stage.endTime = new Date().toISOString();
  stage.duration = Date.now() - startTime;
  return stage;
}

// 辅助函数：带进度反馈的阶段3执行
async function runStage3WithProgress(
  factory: LLMFactory, 
  question: string, 
  models: string[], 
  stage1: any,
  stage2: any,
  sendSSE: Function
) {
  const stage: any = {
    stage: 3,
    title: '最终验证',
    description: '各模型基于前面的讨论提供最终观点和结论',
    responses: [] as any[],
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0
  };

  const startTime = Date.now();
  const prompt = generateStage3Prompt(question, stage1, stage2);
  
  const progressStep = 15 / models.length; // 70-90%的20%分给各模型
  let currentProgress = 75;

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    
    sendSSE('message', { 
      type: 'model_start', 
      stage: 3, 
      progress: currentProgress, 
      model, 
      message: `🎯 ${model} 正在生成最终观点...` 
    });

    try {
      const client = factory.getClient(model as any);
      const response = await client.generateResponse(prompt);
      
      stage.responses.push(response);
      currentProgress += progressStep;
      
      sendSSE('message', { 
        type: 'model_complete', 
        stage: 3, 
        progress: Math.round(currentProgress), 
        model, 
        message: `✅ ${model} 已完成最终验证` 
      });
      
    } catch (error) {
      console.error(`Model ${model} failed in stage 3:`, error);
      stage.responses.push({
        model,
        content: `错误：${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTime: 0
      });
      
      currentProgress += progressStep;
      sendSSE('message', { 
        type: 'model_error', 
        stage: 3, 
        progress: Math.round(currentProgress), 
        model, 
        message: `❌ ${model} 执行失败` 
      });
    }
  }

  stage.endTime = new Date().toISOString();
  stage.duration = Date.now() - startTime;
  return stage;
}

// 提示词生成函数（从DebateEngine复制）
function generateStage1Prompt(question: string): string {
  return `请针对以下问题提供你的初始观点和分析：

问题：${question}

请从以下几个方面进行分析：
1. 对问题的理解和解读
2. 你的初始立场和观点
3. 支持你观点的主要论据和理由
4. 可能的反对声音和你的初步回应

请提供深入、有逻辑的分析，字数控制在500-800字。`;
}

function generateStage2Prompt(question: string, stage1: any): string {
  const otherViewpoints = stage1.responses
    .map((r: any) => `${r.model}: ${r.content}`)
    .join('\n\n---\n\n');

  return `基于以下问题和其他AI模型的观点，请完善和深化你的分析：

原问题：${question}

其他模型的观点：
${otherViewpoints}

请在考虑其他观点的基础上：
1. 重新审视你的初始立场
2. 针对其他观点提出质疑或补充
3. 完善你的论证逻辑
4. 提出新的见解或角度

请提供更加深入和全面的分析，字数控制在600-1000字。`;
}

function generateStage3Prompt(question: string, stage1: any, stage2: any): string {
  // 智能截断策略，控制Token长度
  const MAX_CONTENT_LENGTH = 1500; // 每个回复最大长度
  const MAX_TOTAL_LENGTH = 8000; // 总讨论内容最大长度
  
  // 截断单个回复内容
  const truncateContent = (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content;
    
    // 优先保留前半部分和结尾部分
    const keepStart = Math.floor(maxLength * 0.6);
    const keepEnd = Math.floor(maxLength * 0.3);
    const ellipsis = '\n...[内容已截断]...\n';
    
    return content.substring(0, keepStart) + ellipsis + content.substring(content.length - keepEnd);
  };

  // 生成关键论点摘要
  const generateKeyPoints = (responses: any[]): string => {
    const keyPoints: string[] = [];
    responses.forEach((response) => {
      const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
      // 提取关键句子（通常是段落开头或包含关键词的句子）
      const sentences = truncated.split(/[。！？.]/).filter(s => s.trim().length > 10);
      const keySentences = sentences.slice(0, 3).join('。') + '。';
      keyPoints.push(`${response.model}: ${keySentences}`);
    });
    return keyPoints.join('\n\n');
  };

  let discussionSummary = '';
  
  // 第一阶段关键观点
  discussionSummary += '=== 初始观点要点 ===\n';
  discussionSummary += generateKeyPoints(stage1.responses);
  
  // 第二阶段关键观点
  discussionSummary += '\n\n=== 完善观点要点 ===\n';
  discussionSummary += generateKeyPoints(stage2.responses);
  
  // 检查总长度，如果仍然过长则进一步压缩
  if (discussionSummary.length > MAX_TOTAL_LENGTH) {
    // 进一步压缩：只保留每个模型的核心观点
    discussionSummary = '';
    discussionSummary += '=== 核心观点摘要 ===\n';
    
    const allResponses = [...stage1.responses, ...stage2.responses];
    const modelSummaries = new Map<string, string[]>();
    
    allResponses.forEach((response: any) => {
      if (!modelSummaries.has(response.model)) {
        modelSummaries.set(response.model, []);
      }
      // 只保留每个回复的前200字符
      const summary = response.content.substring(0, 200).trim();
      modelSummaries.get(response.model)!.push(summary);
    });
    
    for (const [model, summaries] of modelSummaries) {
      discussionSummary += `\n${model}观点: ${summaries.join(' → ')}\n`;
    }
  }

  return `基于完整的讨论过程，请提供你的最终观点和结论：

原问题：${question}

讨论要点回顾：
${discussionSummary}

请提供：
1. 你的最终立场和结论
2. 经过讨论后的核心论据
3. 对整个辩论过程的总结
4. 对问题的最终回答

注意：请聚焦于核心论点，避免重复前面已讨论的细节。

这是最后一轮，请提供最具说服力的最终观点，字数控制在400-600字。`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📡 [SSE-Backend] 收到请求:', req.method);
  console.log('📡 [SSE-Backend] 请求查询参数:', req.query);
  console.log('📡 [SSE-Backend] 请求体:', req.body);

  if (req.method === 'POST') {
    try {
      const { question, models } = req.body as DebateRequest;
      
      if (!question || !models || models.length === 0) {
        return res.status(400).json({ 
          error: 'Missing required fields: question and models' 
        });
      }

      // 生成会话ID
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 存储请求数据
      sessions.set(sessionId, {
        request: { question, models },
        timestamp: Date.now()
      });

      console.log('📡 [SSE-Backend] 创建会话:', sessionId);
      
      return res.status(200).json({ success: true, sessionId });
    } catch (error) {
      console.error('📡 [SSE-Backend] POST错误:', error);
      return res.status(500).json({ error: 'Failed to create debate session' });
    }
  }

  if (req.method === 'GET') {
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'Missing sessionId' });
    }

    const sessionData = sessions.get(sessionId);
    if (!sessionData) {
      return res.status(404).json({ error: 'Session not found' });
    }

    console.log('📡 [SSE-Backend] 开始SSE连接:', sessionId);

    // 设置SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 发送SSE事件的辅助函数
    const sendSSE = (event: string, data: any) => {
      const jsonData = JSON.stringify(data);
      console.log(`📡 [SSE-Backend] 发送事件 ${event}:`, data);
      res.write(`event: ${event}\n`);
      res.write(`data: ${jsonData}\n\n`);
    };

    try {
      // 立即发送连接确认
      sendSSE('message', { type: 'connected', message: 'SSE connection established' });

      const factory = getLLMFactory();
      const { question, models } = sessionData.request;

      // 创建辩论结果对象
      const result: any = {
        question,
        models,
        stages: [],
        summary: '',
        timestamp: new Date().toISOString(),
        duration: 0
      };

      const overallStartTime = Date.now();

      // 阶段1：初始观点 (0-35%)
      sendSSE('message', { type: 'stage_start', stage: 1, progress: 0, message: '🎯 阶段1：收集各模型初始观点' });
      
      const stage1 = await runStage1WithProgress(factory, question, models, sendSSE);
      result.stages.push(stage1);
      
      sendSSE('message', { 
        type: 'stage_complete', 
        stage: 1, 
        progress: 35, 
        message: '✅ 阶段1完成：初始观点已收集',
        stageData: stage1
      });

      // 阶段2：交叉质疑与完善 (35-70%)
      sendSSE('message', { type: 'stage_start', stage: 2, progress: 35, message: '🔄 阶段2：观点交互与完善' });
      
      const stage2 = await runStage2WithProgress(factory, question, models, stage1, sendSSE);
      result.stages.push(stage2);
      
      sendSSE('message', { 
        type: 'stage_complete', 
        stage: 2, 
        progress: 70, 
        message: '✅ 阶段2完成：观点已完善',
        stageData: stage2
      });

      // 阶段3：最终验证 (70-100%)
      sendSSE('message', { type: 'stage_start', stage: 3, progress: 70, message: '🎊 阶段3：最终验证与总结' });
      
      const stage3 = await runStage3WithProgress(factory, question, models, stage1, stage2, sendSSE);
      result.stages.push(stage3);
      
      sendSSE('message', { 
        type: 'stage_complete', 
        stage: 3, 
        progress: 90, 
        message: '✅ 阶段3完成：最终观点已生成',
        stageData: stage3
      });

      // 生成总结
      sendSSE('message', { type: 'stage_progress', stage: 3, progress: 95, message: '📝 正在生成辩论总结...' });
      
      // 这里可以添加总结生成逻辑
      result.summary = '辩论总结已生成';
      result.duration = Date.now() - overallStartTime;

      sendSSE('message', { type: 'stage_complete', stage: 3, progress: 100, message: '🎉 辩论生成完成！' });

      // 发送最终结果
      sendSSE('message', { type: 'complete', data: result, message: 'Debate generation completed' });

      console.log('📡 [SSE-Backend] SSE流程完成:', sessionId);

    } catch (error) {
      console.error('📡 [SSE-Backend] SSE处理错误:', error);
      sendSSE('message', { 
        type: 'error',
        message: 'Error generating debate', 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
    } finally {
      // 清理会话
      sessions.delete(sessionId);
      res.end();
    }
  } else {
    res.setHeader('Allow', ['POST', 'GET']);
    res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
}

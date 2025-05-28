import type { NextApiRequest, NextApiResponse } from 'next';
import { LLMFactory } from '../../api/llm/factory';
import { EoTEngine, EoTRequest } from '../../api/eot/engine';
import { EoTStrategy } from '../../src/types';

interface SessionData {
  request: EoTRequest;
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

// 通用阶段执行函数，支持进度反馈
async function runStageWithProgress(
  factory: LLMFactory,
  models: string[],
  stageNumber: number,
  title: string,
  description: string,
  prompt: string,
  sendSSE: Function,
  config?: any
) {
  const stage: any = {
    stage: stageNumber,
    title,
    description,
    responses: [] as any[],
    startTime: new Date().toISOString(),
    endTime: '',
    duration: 0
  };

  const startTime = Date.now();
  const baseProgress = (stageNumber - 1) * 30; // 每个阶段占30%
  const progressStep = 25 / models.length; // 留5%给阶段完成
  let currentProgress = baseProgress + 2;

  // 发送阶段开始信息
  sendSSE('message', {
    type: 'stage_start',
    stage: stageNumber,
    title,
    description,
    progress: baseProgress,
    message: `🚀 开始${title}...`
  });

  // 依次或并行执行模型
  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    
    sendSSE('message', {
      type: 'model_start',
      stage: stageNumber,
      progress: currentProgress,
      model,
      message: `🤖 ${model} 正在${title}中...`
    });

    try {
      const client = factory.getClient(model as any);
      const response = await client.generateResponse(prompt, config);
      
      stage.responses.push(response);
      currentProgress += progressStep;
      
      sendSSE('message', {
        type: 'model_complete',
        stage: stageNumber,
        progress: Math.round(currentProgress),
        model,
        message: `✅ ${model} 已完成${title}`
      });
      
    } catch (error) {
      console.error(`Model ${model} failed in stage ${stageNumber}:`, error);
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
        stage: stageNumber,
        progress: Math.round(currentProgress),
        model,
        message: `❌ ${model} 执行失败`
      });
    }
  }

  stage.endTime = new Date().toISOString();
  stage.duration = Date.now() - startTime;

  // 发送阶段完成
  sendSSE('message', {
    type: 'stage_complete',
    stage: stageNumber,
    progress: baseProgress + 30,
    message: `🎉 ${title}已完成`
  });

  // 发送阶段数据
  sendSSE('stage_data', {
    stage: stageNumber,
    data: stage
  });

  return stage;
}

// 为不同EoT策略执行相应的流程
async function executeEoTStrategy(
  factory: LLMFactory,
  request: EoTRequest,
  sendSSE: Function
) {
  const result: any = {
    question: request.question,
    models: request.models,
    stages: [],
    summary: '',
    timestamp: new Date().toISOString(),
    duration: 0
  };

  const startTime = Date.now();

  try {
    switch (request.eotStrategy) {
      case 'memory':
        await executeMemoryStrategy(factory, request, result, sendSSE);
        break;
      case 'report':
        await executeReportStrategy(factory, request, result, sendSSE);
        break;
      case 'relay':
        await executeRelayStrategy(factory, request, result, sendSSE);
        break;
      case 'debate':
        await executeDebateStrategy(factory, request, result, sendSSE);
        break;
      default:
        throw new Error(`Unsupported EoT strategy: ${request.eotStrategy}`);
    }

    // 生成总结
    sendSSE('message', {
      type: 'generating_summary',
      progress: 95,
      message: '🔄 正在生成总结...'
    });

    result.summary = await generateSummary(factory, request, result.stages);
    result.duration = Date.now() - startTime;

    sendSSE('message', {
      type: 'complete',
      progress: 100,
      message: '✅ 所有阶段已完成！'
    });

    sendSSE('final_result', result);

  } catch (error) {
    console.error('EoT execution failed:', error);
    sendSSE('error', {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    });
  }
}

// Memory策略执行
async function executeMemoryStrategy(
  factory: LLMFactory,
  request: EoTRequest,
  result: any,
  sendSSE: Function
) {
  // 阶段1: 独立思考
  const stage1Prompt = generateMemoryStage1Prompt(request.question);
  const stage1 = await runStageWithProgress(
    factory, request.models, 1, '独立思考', '各模型独立分析问题',
    stage1Prompt, sendSSE, request.config
  );
  result.stages.push(stage1);

  // 阶段2: 共享内存推理
  const stage2Prompt = generateMemoryStage2Prompt(request.question, stage1);
  const stage2 = await runStageWithProgress(
    factory, request.models, 2, '共享内存推理', '基于所有初始思考进行深度推理',
    stage2Prompt, sendSSE, request.config
  );
  result.stages.push(stage2);

  // 阶段3: 综合决策
  const stage3Prompt = generateMemoryStage3Prompt(request.question, stage1, stage2);
  const stage3 = await runStageWithProgress(
    factory, request.models, 3, '综合决策', '基于共享知识生成最终答案',
    stage3Prompt, sendSSE, request.config
  );
  result.stages.push(stage3);
}

// Report策略执行
async function executeReportStrategy(
  factory: LLMFactory,
  request: EoTRequest,
  result: any,
  sendSSE: Function
) {
  const centerModel = request.models[0];

  // 阶段1: 信息汇报
  const stage1Prompt = generateReportStage1Prompt(request.question);
  const stage1 = await runStageWithProgress(
    factory, request.models, 1, '信息汇报', '外围模型向中心节点汇报初始分析',
    stage1Prompt, sendSSE, request.config
  );
  result.stages.push(stage1);

  // 阶段2: 中心分析 (只有中心模型执行)
  const stage2Prompt = generateReportStage2Prompt(request.question, stage1);
  const stage2 = await runStageWithProgress(
    factory, [centerModel], 2, '中心分析', '中心节点综合分析并提供指导',
    stage2Prompt, sendSSE, request.config
  );
  result.stages.push(stage2);

  // 阶段3: 指导决策
  const stage3Prompt = generateReportStage3Prompt(request.question, stage1, stage2);
  const stage3 = await runStageWithProgress(
    factory, request.models, 3, '指导决策', '基于中心节点的分析指导给出最终答案',
    stage3Prompt, sendSSE, request.config
  );
  result.stages.push(stage3);
}

// Relay策略执行
async function executeRelayStrategy(
  factory: LLMFactory,
  request: EoTRequest,
  result: any,
  sendSSE: Function
) {
  let currentThought = '';

  // 逐个模型进行接力推理
  for (let i = 0; i < request.models.length; i++) {
    const model = request.models[i];
    const isFirst = i === 0;
    const isLast = i === request.models.length - 1;
    
    const prompt = generateRelayPrompt(request.question, currentThought, isFirst, isLast);
    const stage = await runStageWithProgress(
      factory, [model], i + 1, `接力推理 - ${model}`,
      isFirst ? '开始推理链' : isLast ? '完成推理链' : '继续推理链',
      prompt, sendSSE, request.config
    );
    
    result.stages.push(stage);
    
    // 更新当前思考链
    if (stage.responses.length > 0) {
      currentThought = stage.responses[0].content;
    }
  }

  // 验证阶段
  const verificationPrompt = generateRelayVerificationPrompt(request.question, result.stages);
  const verificationStage = await runStageWithProgress(
    factory, request.models, request.models.length + 1, '推理验证', '验证和评估推理链',
    verificationPrompt, sendSSE, request.config
  );
  result.stages.push(verificationStage);
}

// Debate策略执行（复用原有逻辑）
async function executeDebateStrategy(
  factory: LLMFactory,
  request: EoTRequest,
  result: any,
  sendSSE: Function
) {
  // 阶段1: 初始观点
  const stage1Prompt = generateDebateStage1Prompt(request.question);
  const stage1 = await runStageWithProgress(
    factory, request.models, 1, '初始观点', '各模型提供对问题的初始观点和分析',
    stage1Prompt, sendSSE, request.config
  );
  result.stages.push(stage1);

  // 阶段2: 交叉质疑与完善
  const stage2Prompt = generateDebateStage2Prompt(request.question, stage1);
  const stage2 = await runStageWithProgress(
    factory, request.models, 2, '交叉质疑与完善', '各模型对其他模型的观点进行质疑、补充和完善',
    stage2Prompt, sendSSE, request.config
  );
  result.stages.push(stage2);

  // 阶段3: 最终验证
  const stage3Prompt = generateDebateStage3Prompt(request.question, stage1, stage2);
  const stage3 = await runStageWithProgress(
    factory, request.models, 3, '最终验证', '各模型基于前面的讨论提供最终观点和结论',
    stage3Prompt, sendSSE, request.config
  );
  result.stages.push(stage3);
}

// 提示词生成函数（简化版，复用EoTEngine的逻辑）
function generateMemoryStage1Prompt(question: string): string {
  return `作为独立的分析节点，请对以下问题进行深入思考：

问题：${question}

请提供：
1. 你的独立分析和理解
2. 关键因素识别
3. 初步结论和建议
4. 需要进一步探讨的问题

保持分析的独立性和深度。`;
}

function generateMemoryStage2Prompt(question: string, stage1: any): string {
  const MAX_CONTENT_LENGTH = 1000;
  
  const truncateContent = (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content;
    const keepStart = Math.floor(maxLength * 0.7);
    const keepEnd = Math.floor(maxLength * 0.2);
    const ellipsis = '\n...[内容已截断]...\n';
    return content.substring(0, keepStart) + ellipsis + content.substring(content.length - keepEnd);
  };

  let sharedMemory = '';
  stage1.responses.forEach((response: any, index: number) => {
    const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
    sharedMemory += `\n节点${index + 1}(${response.model})的分析：\n${truncated}\n`;
  });

  return `现在你可以访问所有节点的初始分析结果。请基于这个共享内存池进行深度推理：

问题：${question}

共享内存池：${sharedMemory}

请：
1. 整合不同节点的有价值见解
2. 识别分析中的共同点和分歧点
3. 提出更深层次的分析和推理
4. 为最终决策提供支撑论据

注意保持逻辑的严密性和分析的深度。`;
}

function generateMemoryStage3Prompt(question: string, stage1: any, stage2: any): string {
  const MAX_CONTENT_LENGTH = 800;
  const MAX_TOTAL_LENGTH = 6000;
  
  const truncateContent = (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content;
    const keepStart = Math.floor(maxLength * 0.6);
    const keepEnd = Math.floor(maxLength * 0.3);
    const ellipsis = '\n...[已截断]...\n';
    return content.substring(0, keepStart) + ellipsis + content.substring(content.length - keepEnd);
  };

  let allMemory = '\n=== 初始分析要点 ===\n';
  stage1.responses.forEach((response: any, index: number) => {
    const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
    allMemory += `节点${index + 1}：${truncated}\n\n`;
  });

  allMemory += '\n=== 深度推理要点 ===\n';
  stage2.responses.forEach((response: any, index: number) => {
    const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
    allMemory += `节点${index + 1}：${truncated}\n\n`;
  });

  if (allMemory.length > MAX_TOTAL_LENGTH) {
    allMemory = '\n=== 关键信息摘要 ===\n';
    const allResponses = [...stage1.responses, ...stage2.responses];
    allResponses.forEach((response: any) => {
      const summary = response.content.substring(0, 300).trim();
      allMemory += `${response.model}: ${summary}...\n\n`;
    });
  }

  return `基于完整的共享内存和推理过程，请给出最终决策：

问题：${question}

完整内存：${allMemory}

请提供：
1. 综合所有分析的最终结论
2. 决策的核心依据
3. 可能的风险或不确定性
4. 具体的行动建议或解决方案

注意：请聚焦于最终决策，避免重复前面的分析细节。`;
}

// Report策略提示词
function generateReportStage1Prompt(question: string): string {
  return `作为分析团队的成员，请向中心节点汇报你对以下问题的分析：

问题：${question}

请提供清晰、结构化的汇报：
1. 问题分析和理解
2. 关键发现和洞察
3. 推荐的处理方向
4. 需要中心节点重点关注的问题

请保持汇报的专业性和简洁性。`;
}

function generateReportStage2Prompt(question: string, stage1: any): string {
  let reports = '';
  stage1.responses.forEach((response: any) => {
    const truncated = response.content.length > 800 ? 
      response.content.substring(0, 800) + '...[已截断]' : response.content;
    reports += `\n${response.model}的汇报：\n${truncated}\n`;
  });

  return `作为中心分析节点，请综合所有团队成员的汇报，提供统一的分析指导：

问题：${question}

团队汇报：${reports}

请提供：
1. 综合分析和判断
2. 关键问题的优先级排序
3. 具体的指导意见和建议
4. 需要团队重点关注的方向

作为中心节点，你的分析将指导整个团队的最终决策。`;
}

function generateReportStage3Prompt(question: string, stage1: any, stage2: any): string {
  let centerGuidance = '';
  if (stage2.responses.length > 0) {
    const guidance = stage2.responses[0].content;
    centerGuidance = guidance.length > 1000 ? 
      guidance.substring(0, 1000) + '...[已截断]' : guidance;
  }

  return `基于中心节点的分析指导，请提供你的最终决策和建议：

问题：${question}

中心节点的指导：${centerGuidance}

请基于中心指导：
1. 制定具体的行动方案
2. 说明你的决策依据
3. 评估实施的可行性
4. 提出可能的风险防范措施

确保你的决策与中心指导保持一致。`;
}

// Relay策略提示词
function generateRelayPrompt(question: string, previousThought: string, isFirst: boolean, isLast: boolean): string {
  if (isFirst) {
    return `你是推理链的第一个节点。请开始对以下问题的推理：

问题：${question}

请：
1. 分析问题的核心要素
2. 建立推理的基础框架
3. 提出初步的思考方向
4. 为下一个节点提供推理起点

开始你的推理。`;
  }

  if (isLast) {
    const truncatedThought = previousThought.length > 1500 ? 
      previousThought.substring(0, 1500) + '...[推理链已截断]' : previousThought;

    return `你是推理链的最后一个节点。请基于前面的推理链完成最终分析：

问题：${question}

前面的推理链：${truncatedThought}

请：
1. 整合前面所有的推理成果
2. 完善整个推理链
3. 给出最终的结论和建议
4. 确保推理的完整性和逻辑性`;
  }

  const truncatedThought = previousThought.length > 1200 ? 
    previousThought.substring(0, 1200) + '...[推理链已截断]' : previousThought;

  return `你是推理链的中间节点。请基于前一个节点的推理继续深化分析：

问题：${question}

前一个节点的推理：${truncatedThought}

请：
1. 接续前面的推理逻辑
2. 深化和扩展分析
3. 提出新的见解或论据
4. 为下一个节点提供更丰富的推理基础

确保推理链的连续性和递进性。`;
}

function generateRelayVerificationPrompt(question: string, relayStages: any[]): string {
  let relayChain = '';
  relayStages.forEach((stage: any, index: number) => {
    if (stage.responses.length > 0) {
      const content = stage.responses[0].content;
      const truncated = content.length > 600 ? content.substring(0, 600) + '...' : content;
      relayChain += `\n第${index + 1}环(${stage.responses[0].model})：\n${truncated}\n`;
    }
  });

  return `完整的推理链已经形成。请验证和评估这个推理过程：

问题：${question}

完整推理链：${relayChain}

请：
1. 评估推理链的逻辑性和完整性
2. 指出推理中的优点和可能的不足
3. 验证最终结论的合理性
4. 提供你的独立验证意见`;
}

// Debate策略提示词（复用原有逻辑）
function generateDebateStage1Prompt(question: string): string {
  return `作为一个专业的辩论参与者，请对以下问题提供你的初始观点和分析：

问题：${question}

请按照以下要求回答：
1. 明确表达你的立场和观点
2. 提供支持你观点的主要论据（至少3个）
3. 分析可能的反对观点
4. 保持逻辑清晰，论证有力
5. 回答长度控制在300-500字

请开始你的回答：`;
}

function generateDebateStage2Prompt(question: string, stage1: any): string {
  let othersViews = '';
  stage1.responses.forEach((response: any, index: number) => {
    const content = response.content.length > 800 ? 
      response.content.substring(0, 800) + '...[已截断]' : response.content;
    othersViews += `\n\n观点${index + 1}（${response.model}）：\n${content}`;
  });

  return `现在进入辩论的第二阶段：交叉质疑与完善。

原始问题：${question}

其他参与者的初始观点：${othersViews}

请基于以上信息：
1. 指出其他观点中你认为有问题或不够充分的地方
2. 对你认为有价值的观点给予认可和补充
3. 进一步完善和强化你自己的观点
4. 提出新的论据或证据来支持你的立场
5. 保持建设性和专业性

请提供你的分析和完善后的观点：`;
}

function generateDebateStage3Prompt(question: string, stage1: any, stage2: any): string {
  // 智能截断策略，控制Token长度
  const MAX_CONTENT_LENGTH = 1500;
  const MAX_TOTAL_LENGTH = 8000;
  
  const truncateContent = (content: string, maxLength: number): string => {
    if (content.length <= maxLength) return content;
    const keepStart = Math.floor(maxLength * 0.6);
    const keepEnd = Math.floor(maxLength * 0.3);
    const ellipsis = '\n...[内容已截断]...\n';
    return content.substring(0, keepStart) + ellipsis + content.substring(content.length - keepEnd);
  };

  const generateKeyPoints = (responses: any[]): string => {
    const keyPoints: string[] = [];
    responses.forEach((response) => {
      const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
      const sentences = truncated.split(/[。！？.]/).filter(s => s.trim().length > 10);
      const keySentences = sentences.slice(0, 3).join('。') + '。';
      keyPoints.push(`${response.model}: ${keySentences}`);
    });
    return keyPoints.join('\n\n');
  };

  let discussionSummary = '';
  discussionSummary += '=== 初始观点要点 ===\n';
  discussionSummary += generateKeyPoints(stage1.responses);
  discussionSummary += '\n\n=== 完善观点要点 ===\n';
  discussionSummary += generateKeyPoints(stage2.responses);
  
  if (discussionSummary.length > MAX_TOTAL_LENGTH) {
    discussionSummary = '';
    discussionSummary += '=== 核心观点摘要 ===\n';
    
    const allResponses = [...stage1.responses, ...stage2.responses];
    const modelSummaries = new Map<string, string[]>();
    
    allResponses.forEach((response: any) => {
      if (!modelSummaries.has(response.model)) {
        modelSummaries.set(response.model, []);
      }
      const summary = response.content.substring(0, 200).trim();
      modelSummaries.get(response.model)!.push(summary);
    });
    
    for (const [model, summaries] of modelSummaries) {
      discussionSummary += `\n${model}观点: ${summaries.join(' → ')}\n`;
    }
  }

  return `现在进入辩论的最终阶段：最终验证与总结。

原始问题：${question}

讨论要点回顾：${discussionSummary}

请基于以上讨论要点：
1. 总结你的最终立场和核心观点
2. 整合讨论中的有价值见解
3. 指出讨论中达成的共识（如果有）
4. 承认仍存在分歧的地方
5. 提供你的最终结论和建议

注意：请聚焦于核心论点，避免重复前面已讨论的细节。

请提供你的最终观点：`;
}

// 生成总结
async function generateSummary(
  factory: LLMFactory,
  request: EoTRequest,
  stages: any[]
): Promise<string> {
  try {
    const summarizer = factory.getClient(request.models[0] as any);
    
    let content = `问题：${request.question}\n策略：${request.eotStrategy}\n\n`;
    
    stages.forEach(stage => {
      content += `=== ${stage.title} ===\n`;
      stage.responses.forEach((response: any) => {
        const truncated = response.content.length > 300 ? 
          response.content.substring(0, 300) + '...' : response.content;
        content += `\n${response.model}：\n${truncated}\n`;
      });
      content += '\n';
    });

    const summaryPrompt = `请为以下${request.eotStrategy}策略的推理过程生成一个综合性总结：

${content}

请提供：
1. 推理过程的特点和优势
2. 主要发现和核心观点
3. 不同阶段的价值贡献
4. 最终结论和建议
5. 推理质量评估

总结应该客观、全面，长度控制在250-350字：`;

    const summaryResponse = await summarizer.generateResponse(summaryPrompt);
    return summaryResponse.content;
  } catch (error) {
    console.error('Failed to generate summary:', error);
    return '总结生成失败，请查看具体的推理内容。';
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  console.log('📡 [EoT-SSE-Backend] 收到请求:', req.method);

  if (req.method === 'POST') {
    try {
      const { question, models, config, eotStrategy }: EoTRequest = req.body;
      
      if (!question || !models || models.length === 0 || !eotStrategy) {
        return res.status(400).json({ 
          error: 'Missing required fields: question, models, and eotStrategy' 
        });
      }

      // 生成会话ID
      const sessionId = `eot_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // 存储请求数据
      sessions.set(sessionId, {
        request: { question, models, config, eotStrategy },
        timestamp: Date.now()
      });

      console.log('📡 [EoT-SSE-Backend] 创建会话:', sessionId);
      
      return res.status(200).json({ success: true, sessionId });
    } catch (error) {
      console.error('📡 [EoT-SSE-Backend] POST错误:', error);
      return res.status(500).json({ error: 'Failed to create EoT session' });
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

    console.log('📡 [EoT-SSE-Backend] 开始SSE连接:', sessionId);

    // 设置SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 发送SSE事件的辅助函数
    const sendSSE = (event: string, data: any) => {
      const jsonData = JSON.stringify(data);
      console.log(`📡 [EoT-SSE-Backend] 发送事件 ${event}:`, data);
      res.write(`event: ${event}\n`);
      res.write(`data: ${jsonData}\n\n`);
    };

    try {
      // 立即发送连接确认
      sendSSE('message', { type: 'connected', message: 'EoT SSE connection established' });

      const factory = getLLMFactory();
      
      // 执行EoT策略
      await executeEoTStrategy(factory, sessionData.request, sendSSE);

      // 清理会话
      sessions.delete(sessionId);

    } catch (error) {
      console.error('📡 [EoT-SSE-Backend] 执行错误:', error);
      sendSSE('error', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      res.end();
    }

    return;
  }

  // 不支持的方法
  res.status(405).json({ error: 'Method not allowed' });
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
    responseLimit: '8mb',
  },
  maxDuration: 300, // 5分钟超时
};

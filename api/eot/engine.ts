import { LLMFactory, LLMProvider } from '../llm/factory';
import { DebateStage, DebateResult, ModelConfig, EoTStrategy } from '../../src/types';
import { DebateError } from '../utils/error-handler';
import { applyTeacherPersona, getTeacherPersonaById } from '../../src/utils/teacherPersonas';

export interface EoTRequest {
  question: string;
  models: string[];
  config?: ModelConfig;
  eotStrategy: EoTStrategy;
  teacherPersonas?: { [modelId: string]: string }; // 添加教师人格化支持
}

export interface EoTResponse {
  success: boolean;
  data?: DebateResult;
  error?: string;
  timestamp: string;
}

/**
 * EoT引擎 - 实现Exchange-of-Thought的四种通信范式
 * 1. Memory (Bus): 总线型 - 共享内存模式
 * 2. Report (Star): 星型 - 中心汇报模式
 * 3. Relay (Ring): 环型 - 接力传递模式
 * 4. Debate: 辩论型 - 完全连通辩论模式
 */
export class EoTEngine {
  private llmFactory: LLMFactory;

  constructor(llmFactory: LLMFactory) {
    this.llmFactory = llmFactory;
  }

  /**
   * 应用教师人格化到prompt的辅助方法
   */
  private applyTeacherPersonaIfNeeded(
    prompt: string,
    modelId: string,
    request: EoTRequest
  ): string {
    if (request.teacherPersonas && request.teacherPersonas[modelId]) {
      const teacherPersonaId = request.teacherPersonas[modelId];
      const personalizedPrompt = applyTeacherPersona(prompt, teacherPersonaId);
      console.log(`Applied teacher persona ${teacherPersonaId} for model ${modelId}`);
      return personalizedPrompt;
    }
    return prompt;
  }

  async runEoT(request: EoTRequest): Promise<EoTResponse> {
    const startTime = Date.now();
    
    try {
      this.validateRequest(request);
      await this.validateModels(request.models);

      const result: DebateResult = {
        question: request.question,
        models: request.models,
        stages: [],
        summary: '',
        timestamp: new Date().toISOString(),
        duration: 0
      };

      // 根据策略选择执行方法
      switch (request.eotStrategy) {
        case 'memory':
          await this.runMemoryStrategy(request, result);
          break;
        case 'report':
          await this.runReportStrategy(request, result);
          break;
        case 'relay':
          await this.runRelayStrategy(request, result);
          break;
        case 'debate':
        default:
          await this.runDebateStrategy(request, result);
          break;
      }

      // 生成总结
      result.summary = await this.generateSummary(request, result.stages);
      result.duration = Date.now() - startTime;

      return {
        success: true,
        data: result,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('EoT execution failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Memory (Bus) 策略 - 总线型通信
   * 阶段1: 每个模型独立思考
   * 阶段2: 所有模型同时访问共享内存池进行推理
   * 阶段3: 基于共享知识生成最终答案
   */
  private async runMemoryStrategy(request: EoTRequest, result: DebateResult): Promise<void> {
    // 阶段1: 初始独立思考
    const stage1 = await this.runStage(request, 1, '独立思考', '各模型独立分析问题', (question) => 
      this.generateMemoryStage1Prompt(question)
    );
    result.stages.push(stage1);

    // 阶段2: 共享内存池推理
    const stage2 = await this.runStage(request, 2, '共享内存推理', '基于所有初始思考进行深度推理', (question) =>
      this.generateMemoryStage2Prompt(question, stage1)
    );
    result.stages.push(stage2);

    // 阶段3: 综合决策
    const stage3 = await this.runStage(request, 3, '综合决策', '基于共享知识生成最终答案', (question) =>
      this.generateMemoryStage3Prompt(question, stage1, stage2)
    );
    result.stages.push(stage3);
  }

  /**
   * Report (Star) 策略 - 星型通信
   * 阶段1: 选择中心节点，其他节点向中心汇报
   * 阶段2: 中心节点综合分析并分发指导
   * 阶段3: 各节点基于中心指导给出最终结论
   */
  private async runReportStrategy(request: EoTRequest, result: DebateResult): Promise<void> {
    const centerModel = request.models[0]; // 选择第一个模型作为中心
    const peripheralModels = request.models.slice(1);

    // 阶段1: 外围节点向中心汇报
    const stage1 = await this.runStage(request, 1, '信息汇报', '外围模型向中心节点汇报初始分析', (question) =>
      this.generateReportStage1Prompt(question)
    );
    result.stages.push(stage1);

    // 阶段2: 中心节点分析并分发指导
    const stage2 = await this.runCenterAnalysis(request, centerModel, stage1);
    result.stages.push(stage2);

    // 阶段3: 基于中心指导的最终决策
    const stage3 = await this.runStage(request, 3, '指导决策', '基于中心节点的分析指导给出最终答案', (question) =>
      this.generateReportStage3Prompt(question, stage1, stage2)
    );
    result.stages.push(stage3);
  }

  /**
   * Relay (Ring) 策略 - 环型通信
   * 信息按顺序在模型间传递，每个模型在前一个模型的基础上继续推理
   */
  private async runRelayStrategy(request: EoTRequest, result: DebateResult): Promise<void> {
    const models = request.models;
    let currentThought = '';

    // 阶段1: 环型接力推理
    for (let i = 0; i < models.length; i++) {
      const isFirst = i === 0;
      const isLast = i === models.length - 1;
      const stage = await this.runRelayStage(
        request, 
        i + 1, 
        models[i], 
        currentThought, 
        isFirst, 
        isLast
      );
      result.stages.push(stage);
      
      // 更新当前思考链
      if (stage.responses.length > 0) {
        currentThought = stage.responses[0].content;
      }
    }

    // 阶段2: 环型验证
    const verificationStage = await this.runRelayVerification(request, result.stages);
    result.stages.push(verificationStage);
  }

  /**
   * Debate 策略 - 完全连通辩论模式（原有实现）
   */
  private async runDebateStrategy(request: EoTRequest, result: DebateResult): Promise<void> {
    // 重用原有的辩论逻辑
    const stage1 = await this.runStage(request, 1, '初始观点', '各模型提供对问题的初始观点和分析', (question) =>
      this.generateDebateStage1Prompt(question)
    );
    result.stages.push(stage1);

    const stage2 = await this.runStage(request, 2, '交叉质疑与完善', '各模型对其他模型的观点进行质疑、补充和完善', (question) =>
      this.generateDebateStage2Prompt(question, stage1)
    );
    result.stages.push(stage2);

    const stage3 = await this.runStage(request, 3, '最终验证', '各模型基于前面的讨论提供最终观点和结论', (question) =>
      this.generateDebateStage3Prompt(question, stage1, stage2)
    );
    result.stages.push(stage3);
  }

  // 通用阶段执行方法
  private async runStage(
    request: EoTRequest,
    stageNumber: number,
    title: string,
    description: string,
    promptGenerator: (question: string) => string
  ): Promise<DebateStage> {
    const stage: DebateStage = {
      stage: stageNumber,
      title,
      description,
      responses: [],
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };

    const startTime = Date.now();
    const prompt = promptGenerator(request.question);

    const responsePromises = request.models.map(async (model) => {
      try {
        const client = this.llmFactory.getClient(model as any);
        const response = await client.generateResponse(prompt, request.config);
        return response;
      } catch (error) {
        console.error(`Model ${model} failed in stage ${stageNumber}:`, error);
        return {
          model,
          content: `错误：${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          responseTime: 0
        };
      }
    });

    stage.responses = await Promise.all(responsePromises);
    stage.endTime = new Date().toISOString();
    stage.duration = Date.now() - startTime;

    // 应用教师人格化（如果有）
    for (const model of request.models) {
      const modelResponses = stage.responses.filter(response => response.model === model);
      for (let i = 0; i < modelResponses.length; i++) {
        const response = modelResponses[i];
        response.content = this.applyTeacherPersonaIfNeeded(response.content, model, request);
      }
    }

    return stage;
  }

  // 中心节点分析（Report策略专用）
  private async runCenterAnalysis(request: EoTRequest, centerModel: string, stage1: DebateStage): Promise<DebateStage> {
    const stage: DebateStage = {
      stage: 2,
      title: '中心分析',
      description: '中心节点综合分析并提供指导',
      responses: [],
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };

    const startTime = Date.now();
    const prompt = this.generateReportStage2Prompt(request.question, stage1);

    try {
      const client = this.llmFactory.getClient(centerModel as any);
      const response = await client.generateResponse(prompt, request.config);
      stage.responses = [response];
    } catch (error) {
      console.error(`Center model ${centerModel} failed:`, error);
      stage.responses = [{
        model: centerModel,
        content: `错误：${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTime: 0
      }];
    }

    stage.endTime = new Date().toISOString();
    stage.duration = Date.now() - startTime;

    return stage;
  }

  // 环型接力阶段（Relay策略专用）
  private async runRelayStage(
    request: EoTRequest,
    stageNumber: number,
    model: string,
    previousThought: string,
    isFirst: boolean,
    isLast: boolean
  ): Promise<DebateStage> {
    const stage: DebateStage = {
      stage: stageNumber,
      title: `接力推理 - ${model}`,
      description: isFirst ? '开始推理链' : isLast ? '完成推理链' : '继续推理链',
      responses: [],
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };

    const startTime = Date.now();
    const prompt = this.generateRelayPrompt(request.question, previousThought, isFirst, isLast);

    try {
      const client = this.llmFactory.getClient(model as any);
      const response = await client.generateResponse(prompt, request.config);
      stage.responses = [response];
    } catch (error) {
      console.error(`Relay model ${model} failed:`, error);
      stage.responses = [{
        model,
        content: `错误：${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date().toISOString(),
        usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
        responseTime: 0
      }];
    }

    stage.endTime = new Date().toISOString();
    stage.duration = Date.now() - startTime;

    return stage;
  }

  // 环型验证阶段
  private async runRelayVerification(request: EoTRequest, previousStages: DebateStage[]): Promise<DebateStage> {
    const stage: DebateStage = {
      stage: previousStages.length + 1,
      title: '环型验证',
      description: '所有模型验证完整推理链',
      responses: [],
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };

    const startTime = Date.now();
    const prompt = this.generateRelayVerificationPrompt(request.question, previousStages);

    const responsePromises = request.models.map(async (model) => {
      try {
        const client = this.llmFactory.getClient(model as any);
        const response = await client.generateResponse(prompt, request.config);
        return response;
      } catch (error) {
        console.error(`Verification model ${model} failed:`, error);
        return {
          model,
          content: `错误：${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          responseTime: 0
        };
      }
    });

    stage.responses = await Promise.all(responsePromises);
    stage.endTime = new Date().toISOString();
    stage.duration = Date.now() - startTime;

    return stage;
  }

  // Memory策略提示词生成
  private generateMemoryStage1Prompt(question: string): string {
    return `
作为智能分析系统的一个节点，请对以下问题进行独立分析，为共享内存池贡献你的初始见解：

问题：${question}

请提供：
1. 你对问题的理解和关键要素识别
2. 可能的解决思路或分析角度
3. 需要进一步探讨的关键点
4. 你的初步结论或假设

请保持分析的独立性和客观性，为后续的协作推理打下基础。
    `.trim();
  }

  private generateMemoryStage2Prompt(question: string, stage1: DebateStage): string {
    // 智能截断策略，限制token数量
    const MAX_CONTENT_LENGTH = 1000; // 每个回复最大长度
    
    const truncateContent = (content: string, maxLength: number): string => {
      if (content.length <= maxLength) return content;
      
      const keepStart = Math.floor(maxLength * 0.7);
      const keepEnd = Math.floor(maxLength * 0.2);
      const ellipsis = '\n...[内容已截断]...\n';
      
      return content.substring(0, keepStart) + ellipsis + content.substring(content.length - keepEnd);
    };

    let sharedMemory = '';
    stage1.responses.forEach((response, index) => {
      const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
      sharedMemory += `\n节点${index + 1}(${response.model})的分析：\n${truncated}\n`;
    });

    return `
现在你可以访问所有节点的初始分析结果。请基于这个共享内存池进行深度推理：

问题：${question}

共享内存池：${sharedMemory}

请：
1. 整合不同节点的有价值见解
2. 识别分析中的共同点和分歧点
3. 提出更深层次的分析和推理
4. 为最终决策提供支撑论据

注意保持逻辑的严密性和分析的深度。
    `.trim();
  }

  private generateMemoryStage3Prompt(question: string, stage1: DebateStage, stage2: DebateStage): string {
    // 智能截断策略，限制token数量
    const MAX_CONTENT_LENGTH = 800; // 每个回复最大长度
    const MAX_TOTAL_LENGTH = 6000; // 总内容最大长度
    
    const truncateContent = (content: string, maxLength: number): string => {
      if (content.length <= maxLength) return content;
      
      const keepStart = Math.floor(maxLength * 0.6);
      const keepEnd = Math.floor(maxLength * 0.3);
      const ellipsis = '\n...[已截断]...\n';
      
      return content.substring(0, keepStart) + ellipsis + content.substring(content.length - keepEnd);
    };

    let allMemory = '\n=== 初始分析要点 ===\n';
    stage1.responses.forEach((response, index) => {
      const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
      allMemory += `节点${index + 1}：${truncated}\n\n`;
    });

    allMemory += '\n=== 深度推理要点 ===\n';
    stage2.responses.forEach((response, index) => {
      const truncated = truncateContent(response.content, MAX_CONTENT_LENGTH);
      allMemory += `节点${index + 1}：${truncated}\n\n`;
    });

    // 如果总长度仍然过长，进一步压缩
    if (allMemory.length > MAX_TOTAL_LENGTH) {
      allMemory = '\n=== 关键信息摘要 ===\n';
      const allResponses = [...stage1.responses, ...stage2.responses];
      allResponses.forEach((response, index) => {
        const summary = response.content.substring(0, 300).trim();
        allMemory += `${response.model}: ${summary}...\n\n`;
      });
    }

    return `
基于完整的共享内存和推理过程，请给出最终决策：

问题：${question}

完整内存：${allMemory}

请提供：
1. 综合所有分析的最终结论
2. 决策的核心依据
3. 可能的风险或不确定性
4. 具体的行动建议或解决方案

注意：请聚焦于最终决策，避免重复前面的分析细节。
    `.trim();
  }

  // Report策略提示词生成
  private generateReportStage1Prompt(question: string): string {
    return `
作为分析团队的成员，请向中心节点汇报你对以下问题的分析：

问题：${question}

请提供清晰、结构化的汇报：
1. 问题分析和理解
2. 关键发现和洞察
3. 推荐的处理方向
4. 需要中心节点重点关注的问题

请保持汇报的专业性和简洁性。
    `.trim();
  }

  private generateReportStage2Prompt(question: string, stage1: DebateStage): string {
    let reports = '';
    stage1.responses.forEach((response, index) => {
      reports += `\n成员${index + 1}(${response.model})的汇报：\n${response.content}\n`;
    });

    return `
作为中心分析节点，你已经收到所有团队成员的汇报。请进行综合分析并提供指导：

问题：${question}

团队汇报：${reports}

请作为中心节点：
1. 综合分析所有汇报内容
2. 识别关键信息和重要模式
3. 制定统一的分析框架和方向
4. 为团队成员提供具体的分析指导
5. 指出需要进一步探讨的重点领域

你的分析将指导整个团队的后续工作。
    `.trim();
  }

  private generateReportStage3Prompt(question: string, stage1: DebateStage, stage2: DebateStage): string {
    let centerGuidance = '';
    stage2.responses.forEach(response => {
      centerGuidance += response.content;
    });

    return `
基于中心节点的分析指导，请给出你的最终结论：

问题：${question}

中心节点的指导：${centerGuidance}

请：
1. 严格按照中心节点的指导进行分析
2. 结合你的专业视角深化分析
3. 提供明确的结论和建议
4. 确保与整体分析框架的一致性
    `.trim();
  }

  // Relay策略提示词生成
  private generateRelayPrompt(question: string, previousThought: string, isFirst: boolean, isLast: boolean): string {
    if (isFirst) {
      return `
你是推理链的第一个节点。请开始对以下问题的推理：

问题：${question}

请：
1. 建立分析的基础框架
2. 提出初步的思考方向
3. 为下一个节点提供清晰的推理基础
4. 标识需要进一步深入的关键点

请确保你的分析为后续节点的深入推理铺平道路。
      `.trim();
    }

    if (isLast) {
      return `
你是推理链的最后一个节点。请基于前面的推理链完成最终分析：

问题：${question}

前面的推理链：${previousThought}

请：
1. 整合前面所有的推理成果
2. 完善整个推理链
3. 给出最终的结论和建议
4. 确保推理的完整性和逻辑性
      `.trim();
    }

    return `
你是推理链的中间节点。请基于前一个节点的推理继续深化分析：

问题：${question}

前一个节点的推理：${previousThought}

请：
1. 接续前面的推理逻辑
2. 深化和扩展分析
3. 提出新的见解或论据
4. 为下一个节点提供更丰富的推理基础

确保推理链的连续性和递进性。
    `.trim();
  }

  private generateRelayVerificationPrompt(question: string, relayStages: DebateStage[]): string {
    let relayChain = '';
    relayStages.forEach((stage, index) => {
      if (stage.responses.length > 0) {
        relayChain += `\n第${index + 1}环(${stage.responses[0].model})：\n${stage.responses[0].content}\n`;
      }
    });

    return `
完整的推理链已经形成。请验证和评估这个推理过程：

问题：${question}

完整推理链：${relayChain}

请：
1. 评估推理链的逻辑性和完整性
2. 指出推理中的优点和可能的不足
3. 验证最终结论的合理性
4. 提供你的独立验证意见
    `.trim();
  }

  // Debate策略提示词生成（重用原有逻辑）
  private generateDebateStage1Prompt(question: string): string {
    return `
作为一个专业的辩论参与者，请对以下问题提供你的初始观点和分析：

问题：${question}

请按照以下要求回答：
1. 明确表达你的立场和观点
2. 提供支持你观点的主要论据（至少3个）
3. 分析可能的反对观点
4. 保持逻辑清晰，论证有力
5. 回答长度控制在300-500字

请开始你的回答：
    `.trim();
  }

  private generateDebateStage2Prompt(question: string, stage1: DebateStage): string {
    let othersViews = '';
    stage1.responses.forEach((response, index) => {
      othersViews += `\n\n观点${index + 1}（${response.model}）：\n${response.content}`;
    });

    return `
现在进入辩论的第二阶段：交叉质疑与完善。

原始问题：${question}

其他参与者的初始观点：${othersViews}

请基于以上信息：
1. 指出其他观点中你认为有问题或不够充分的地方
2. 对你认为有价值的观点给予认可和补充
3. 进一步完善和强化你自己的观点
4. 提出新的论据或证据来支持你的立场
5. 保持建设性和专业性

请提供你的分析和完善后的观点：
    `.trim();
  }

  private generateDebateStage3Prompt(question: string, stage1: DebateStage, stage2: DebateStage): string {
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
      responses.forEach((response, index) => {
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
    discussionSummary += '\n\n=== 质疑与完善要点 ===\n';
    discussionSummary += generateKeyPoints(stage2.responses);
    
    // 检查总长度，如果仍然过长则进一步压缩
    if (discussionSummary.length > MAX_TOTAL_LENGTH) {
      // 进一步压缩：只保留每个模型的核心观点
      discussionSummary = '';
      discussionSummary += '=== 核心观点摘要 ===\n';
      
      const allResponses = [...stage1.responses, ...stage2.responses];
      const modelSummaries = new Map<string, string[]>();
      
      allResponses.forEach(response => {
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

    return `
现在进入辩论的最终阶段：最终验证与总结。

原始问题：${question}

讨论要点回顾：${discussionSummary}

请基于以上讨论要点：
1. 总结你的最终立场和核心观点
2. 整合讨论中的有价值见解
3. 指出讨论中达成的共识（如果有）
4. 承认仍存在分歧的地方
5. 提供你的最终结论和建议

注意：请聚焦于核心论点，避免重复前面已讨论的细节。

请提供你的最终观点：
    `.trim();
  }

  // 验证方法
  private validateRequest(request: EoTRequest): void {
    if (!request.question || request.question.trim().length === 0) {
      throw new DebateError('VALIDATION_ERROR', 'Question is required and cannot be empty', undefined, 400);
    }

    if (!request.models || request.models.length === 0) {
      throw new DebateError('VALIDATION_ERROR', 'At least one model must be selected', undefined, 400);
    }

    if (request.models.length > 6) {
      throw new DebateError('VALIDATION_ERROR', 'Maximum 6 models allowed', undefined, 400);
    }

    if (request.question.length > 1000) {
      throw new DebateError('VALIDATION_ERROR', 'Question too long (max 1000 characters)', undefined, 400);
    }

    const validStrategies: EoTStrategy[] = ['debate', 'memory', 'report', 'relay'];
    if (!validStrategies.includes(request.eotStrategy)) {
      throw new DebateError('VALIDATION_ERROR', 'Invalid EoT strategy', undefined, 400);
    }
  }

  private async validateModels(models: string[]): Promise<void> {
    const availableProviders = this.llmFactory.getAvailableProviders();
    const unavailableModels = models.filter(model => !availableProviders.includes(model as any));
    
    if (unavailableModels.length > 0) {
      throw new DebateError(
        'MODEL_UNAVAILABLE',
        `Models not available: ${unavailableModels.join(', ')}`,
        { unavailableModels, availableModels: availableProviders },
        400
      );
    }
  }

  // 生成总结
  private async generateSummary(request: EoTRequest, stages: DebateStage[]): Promise<string> {
    const summarizer = this.llmFactory.getClient(request.models[0] as any);
    
    let content = `问题：${request.question}\n策略：${request.eotStrategy}\n\n`;
    
    stages.forEach(stage => {
      content += `=== ${stage.title} ===\n`;
      stage.responses.forEach((response, index) => {
        content += `\n${response.model}：\n${response.content}\n`;
      });
      content += '\n';
    });

    const summaryPrompt = `
请为以下${request.eotStrategy}策略的推理过程生成一个综合性总结：

${content}

请提供：
1. 推理过程的特点和优势
2. 主要发现和核心观点
3. 不同阶段的价值贡献
4. 最终结论和建议
5. 推理质量评估

总结应该客观、全面，长度控制在250-350字：
    `.trim();

    try {
      const summaryResponse = await summarizer.generateResponse(summaryPrompt);
      return summaryResponse.content;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return '总结生成失败，请查看具体的推理内容。';
    }
  }
}

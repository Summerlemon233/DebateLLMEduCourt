import { LLMFactory, LLMProvider } from '../llm/factory';
import { DebateStage, DebateResult, ModelConfig, LLMResponse, DebateUpdateEvent } from '../../src/types';
import { DebateError } from '../utils/error-handler';

export interface DebateRequest {
  question: string;
  models: string[];
  config?: ModelConfig;
}

export type StreamCallback = (event: DebateUpdateEvent) => void;

export class StreamingDebateEngine {
  private llmFactory: LLMFactory;

  constructor(llmFactory: LLMFactory) {
    this.llmFactory = llmFactory;
  }

  async runStreamingDebate(
    request: DebateRequest, 
    onUpdate: StreamCallback
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 验证输入
      this.validateRequest(request);
      await this.validateModels(request.models);

      const stages: DebateStage[] = [];

      // 阶段1：初始回答
      const stage1 = await this.runStreamingStage1(request, onUpdate);
      stages.push(stage1);
      onUpdate({
        type: 'stage_complete',
        stageNumber: 1,
        stage: stage1
      });

      // 阶段2：交叉质疑与完善
      const stage2 = await this.runStreamingStage2(request, stage1, onUpdate);
      stages.push(stage2);
      onUpdate({
        type: 'stage_complete',
        stageNumber: 2,
        stage: stage2
      });

      // 阶段3：最终验证
      const stage3 = await this.runStreamingStage3(request, stage1, stage2, onUpdate);
      stages.push(stage3);
      onUpdate({
        type: 'stage_complete',
        stageNumber: 3,
        stage: stage3
      });

      // 生成总结
      const summary = await this.generateSummary(request, stages);
      
      // 发送完成事件
      onUpdate({
        type: 'debate_complete',
        stageNumber: 3,
        isComplete: true,
        summary
      });

    } catch (error) {
      console.error('Streaming debate execution failed:', error);
      throw error;
    }
  }

  private validateRequest(request: DebateRequest): void {
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

  private async runStreamingStage1(
    request: DebateRequest, 
    onUpdate: StreamCallback
  ): Promise<DebateStage> {
    const stage: DebateStage = {
      stage: 1,
      title: '初始观点',
      description: '各模型提供对问题的初始观点和分析',
      responses: [],
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };

    const startTime = Date.now();

    // 发送阶段开始事件
    onUpdate({
      type: 'stage_start',
      stageNumber: 1
    });

    // 为每个模型生成初始回答的提示词
    const prompt = this.generateStage1Prompt(request.question);

    // 顺序处理每个模型以实现实时更新
    for (const model of request.models) {
      try {
        const client = this.llmFactory.getClient(model as any);
        const response = await client.generateResponse(prompt, request.config);
        
        // 立即发送模型响应事件
        onUpdate({
          type: 'model_response',
          stageNumber: 1,
          model,
          response
        });

        stage.responses.push(response);
      } catch (error) {
        console.error(`Model ${model} failed in stage 1:`, error);
        const errorResponse: LLMResponse = {
          model,
          content: `错误：${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          responseTime: 0
        };

        onUpdate({
          type: 'model_response',
          stageNumber: 1,
          model,
          response: errorResponse
        });

        stage.responses.push(errorResponse);
      }
    }

    stage.endTime = new Date().toISOString();
    stage.duration = Date.now() - startTime;

    return stage;
  }

  private async runStreamingStage2(
    request: DebateRequest, 
    stage1: DebateStage,
    onUpdate: StreamCallback
  ): Promise<DebateStage> {
    const stage: DebateStage = {
      stage: 2,
      title: '交叉质疑与完善',
      description: '各模型对其他模型的观点进行质疑、补充和完善',
      responses: [],
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };

    const startTime = Date.now();

    // 发送阶段开始事件
    onUpdate({
      type: 'stage_start',
      stageNumber: 2
    });

    // 生成包含其他模型观点的提示词
    const prompt = this.generateStage2Prompt(request.question, stage1);

    // 顺序处理每个模型
    for (const model of request.models) {
      try {
        const client = this.llmFactory.getClient(model as any);
        const response = await client.generateResponse(prompt, request.config);
        
        onUpdate({
          type: 'model_response',
          stageNumber: 2,
          model,
          response
        });

        stage.responses.push(response);
      } catch (error) {
        console.error(`Model ${model} failed in stage 2:`, error);
        const errorResponse: LLMResponse = {
          model,
          content: `错误：${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          responseTime: 0
        };

        onUpdate({
          type: 'model_response',
          stageNumber: 2,
          model,
          response: errorResponse
        });

        stage.responses.push(errorResponse);
      }
    }

    stage.endTime = new Date().toISOString();
    stage.duration = Date.now() - startTime;

    return stage;
  }

  private async runStreamingStage3(
    request: DebateRequest, 
    stage1: DebateStage, 
    stage2: DebateStage,
    onUpdate: StreamCallback
  ): Promise<DebateStage> {
    const stage: DebateStage = {
      stage: 3,
      title: '最终验证',
      description: '各模型基于前面的讨论提供最终观点和结论',
      responses: [],
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0
    };

    const startTime = Date.now();

    // 发送阶段开始事件
    onUpdate({
      type: 'stage_start',
      stageNumber: 3
    });

    // 生成包含所有前面讨论的提示词
    const prompt = this.generateStage3Prompt(request.question, stage1, stage2);

    // 顺序处理每个模型
    for (const model of request.models) {
      try {
        const client = this.llmFactory.getClient(model as any);
        const response = await client.generateResponse(prompt, request.config);
        
        onUpdate({
          type: 'model_response',
          stageNumber: 3,
          model,
          response
        });

        stage.responses.push(response);
      } catch (error) {
        console.error(`Model ${model} failed in stage 3:`, error);
        const errorResponse: LLMResponse = {
          model,
          content: `错误：${error instanceof Error ? error.message : String(error)}`,
          timestamp: new Date().toISOString(),
          usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
          responseTime: 0
        };

        onUpdate({
          type: 'model_response',
          stageNumber: 3,
          model,
          response: errorResponse
        });

        stage.responses.push(errorResponse);
      }
    }

    stage.endTime = new Date().toISOString();
    stage.duration = Date.now() - startTime;

    return stage;
  }

  private generateStage1Prompt(question: string): string {
    return `
作为一个专业的辩论参与者，请对以下问题提供你的初始观点和分析：

问题：${question}

请按照以下要求回答：
1. 明确表达你的立场和观点
2. 提供支持你观点的主要论据（至少3个）
3. 分析可能的反对观点
4. 保持逻辑清晰，论证有力
5. 回答长度控制在300-500字
6. 支持使用Markdown格式，包括**粗体**、*斜体*、列表、引用等来增强可读性

请开始你的回答：
    `.trim();
  }

  private generateStage2Prompt(question: string, stage1: DebateStage): string {
    let othersViews = '';
    stage1.responses.forEach((response, index) => {
      othersViews += `\n\n### 观点${index + 1}（${response.model}）：\n${response.content}`;
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
6. 支持使用Markdown格式来增强可读性

请提供你的分析和完善后的观点：
    `.trim();
  }

  private generateStage3Prompt(
    question: string, 
    stage1: DebateStage, 
    stage2: DebateStage
  ): string {
    let allDiscussion = '';
    
    allDiscussion += '\n## 初始观点阶段\n';
    stage1.responses.forEach((response, index) => {
      allDiscussion += `\n### 观点${index + 1}（${response.model}）：\n${response.content}`;
    });

    allDiscussion += '\n\n## 质疑与完善阶段\n';
    stage2.responses.forEach((response, index) => {
      allDiscussion += `\n### 完善观点${index + 1}（${response.model}）：\n${response.content}`;
    });

    return `
现在进入辩论的最终阶段：最终验证与总结。

原始问题：${question}

完整讨论过程：${allDiscussion}

请基于整个讨论过程：
1. 总结你的最终立场和核心观点
2. 整合讨论中的有价值见解
3. 指出讨论中达成的共识（如果有）
4. 承认仍存在分歧的地方
5. 提供你的最终结论和建议
6. 支持使用Markdown格式来增强可读性

请提供你的最终观点：
    `.trim();
  }

  private async generateSummary(
    request: DebateRequest, 
    stages: DebateStage[]
  ): Promise<string> {
    // 使用第一个可用的模型来生成总结
    const summarizer = this.llmFactory.getClient(request.models[0] as any);
    
    let debateContent = `问题：${request.question}\n\n`;
    
    stages.forEach(stage => {
      debateContent += `## ${stage.title}\n`;
      stage.responses.forEach((response, index) => {
        debateContent += `\n### ${response.model}的观点：\n${response.content}\n`;
      });
      debateContent += '\n';
    });

    const summaryPrompt = `
请为以下辩论过程生成一个综合性总结：

${debateContent}

请提供：
1. 问题的核心争议点
2. 各方主要观点的梳理
3. 讨论中的共识与分歧
4. 有价值的见解和论据
5. 总体结论和思考

总结应该客观、全面，长度控制在200-300字，支持使用Markdown格式：
    `.trim();

    try {
      const summaryResponse = await summarizer.generateResponse(summaryPrompt);
      return summaryResponse.content;
    } catch (error) {
      console.error('Failed to generate summary:', error);
      return '总结生成失败，请查看具体的辩论内容。';
    }
  }
}

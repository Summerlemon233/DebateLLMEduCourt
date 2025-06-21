import { 
  Agent, 
  AgentType, 
  AgentInput, 
  AgentOutput, 
  LearningWorkflow,
  WorkflowStep,
  CollaborationResult,
  LearningResult,
  LearningContext,
  LearnerProfile
} from '../types';

/**
 * 智能体基础类
 * 提供所有智能体的共同功能和接口
 */
export abstract class BaseAgent implements Agent {
  public readonly id: string;
  public readonly type: AgentType;
  public readonly name: string;
  public readonly description: string;
  public readonly capabilities: string[];
  public readonly model: string;
  public readonly promptTemplate: string;
  public readonly enabled: boolean;

  constructor(config: Agent) {
    this.id = config.id;
    this.type = config.type;
    this.name = config.name;
    this.description = config.description;
    this.capabilities = config.capabilities;
    this.model = config.model;
    this.promptTemplate = config.promptTemplate;
    this.enabled = config.enabled;
  }

  /**
   * 处理智能体任务的抽象方法
   * 每个具体智能体需要实现此方法
   */
  abstract process(input: AgentInput): Promise<AgentOutput>;

  /**
   * 构建针对特定任务的提示词
   */
  protected buildPrompt(input: AgentInput, userProfile?: LearnerProfile): string {
    let prompt = this.promptTemplate;
    
    // 替换模板中的变量
    prompt = prompt.replace(/\{(\w+)\}/g, (match, key) => {
      if (input.data && input.data[key] !== undefined) {
        return String(input.data[key]);
      }
      if (input.context && (input.context as any)[key] !== undefined) {
        return String((input.context as any)[key]);
      }
      if (userProfile && (userProfile as any)[key] !== undefined) {
        return String((userProfile as any)[key]);
      }
      return match; // 保持原样如果找不到替换值
    });

    // 添加用户画像信息
    if (userProfile) {
      prompt += this.buildUserProfileContext(userProfile);
    }

    return prompt;
  }

  /**
   * 构建用户画像上下文信息
   */
  private buildUserProfileContext(profile: LearnerProfile): string {
    return `
    
### 学习者信息
- 学习风格: ${profile.learningStyle.visualAuditory}导向, ${profile.learningStyle.processingStyle}处理方式
- 学习节奏: ${profile.learningStyle.pace}
- 偏好格式: ${profile.preferences.contentFormat.join(', ')}
- 反馈风格: ${profile.preferences.feedbackStyle}
- 知识背景: ${Object.entries(profile.knowledgeMap).map(([subject, info]) => 
  `${subject}(级别${info.level})`).join(', ')}

请根据以上学习者特征调整你的回答方式和内容难度。`;
  }

  /**
   * 调用LLM API获取响应
   */
  protected async callLLM(prompt: string, options?: {
    temperature?: number;
    maxTokens?: number;
  }): Promise<string> {
    const startTime = Date.now();
    
    try {
      // 构建完整的URL
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const apiUrl = `${baseUrl}/api/agent-llm-call`;
      
      // 根据智能体配置的模型调用相应的API
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          temperature: options?.temperature || 0.7,
          maxTokens: options?.maxTokens || 2048,
        }),
      });

      if (!response.ok) {
        throw new Error(`LLM API调用失败: ${response.statusText}`);
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error(`智能体 ${this.name} LLM调用失败:`, error);
      throw error;
    }
  }

  /**
   * 验证输入数据
   */
  protected validateInput(input: AgentInput): void {
    if (!input || !input.type) {
      throw new Error('无效的智能体输入: 缺少type字段');
    }
    
    if (!input.data) {
      throw new Error('无效的智能体输入: 缺少data字段');
    }
  }

  /**
   * 创建标准化的输出格式
   */
  protected createOutput(
    content: string, 
    confidence: number = 0.8,
    metadata: Partial<AgentOutput['metadata']> = {},
    suggestions: string[] = []
  ): AgentOutput {
    return {
      agentId: this.id,
      agentType: this.type,
      content,
      confidence,
      metadata: {
        processingTime: 0,
        ...metadata,
      },
      suggestions,
    };
  }
}

/**
 * 智能体工厂类
 * 负责创建和管理智能体实例
 */
export class AgentFactory {
  private static agents: Map<string, BaseAgent> = new Map();

  /**
   * 注册智能体
   */
  static registerAgent(agent: BaseAgent): void {
    this.agents.set(agent.id, agent);
  }

  /**
   * 获取智能体
   */
  static getAgent(id: string): BaseAgent | undefined {
    return this.agents.get(id);
  }

  /**
   * 获取特定类型的智能体
   */
  static getAgentsByType(type: AgentType): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.type === type);
  }

  /**
   * 获取所有可用智能体
   */
  static getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.enabled);
  }

  /**
   * 创建核心智能体集合
   */
  static async initializeCoreAgents(): Promise<void> {
    // 动态导入智能体实现
    const { CurriculumDesignerAgent } = await import('./CurriculumDesignerAgent');
    const { ContentGeneratorAgent } = await import('./ContentGeneratorAgent');
    const { AssessmentExpertAgent } = await import('./AssessmentExpertAgent');
    const { ActivityDesignerAgent } = await import('./ActivityDesignerAgent');

    // 注册核心智能体
    this.registerAgent(new CurriculumDesignerAgent());
    this.registerAgent(new ContentGeneratorAgent());
    this.registerAgent(new AssessmentExpertAgent());
    this.registerAgent(new ActivityDesignerAgent());
  }
}

/**
 * 智能体协调器
 * 管理多个智能体的协作执行
 */
export class AgentOrchestrator {
  private workflows: Map<string, LearningWorkflow> = new Map();

  /**
   * 注册工作流
   */
  registerWorkflow(workflow: LearningWorkflow): void {
    this.workflows.set(workflow.id, workflow);
  }

  /**
   * 执行学习工作流
   */
  async executeWorkflow(
    workflowId: string, 
    context: LearningContext,
    userProfile?: LearnerProfile
  ): Promise<CollaborationResult> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`工作流 ${workflowId} 不存在`);
    }

    const startTime = Date.now();
    const results: AgentOutput[] = [];
    let totalTokens = 0;
    const agentContributions: Record<string, number> = {};

    try {
      // 执行工作流步骤
      for (const step of workflow.steps) {
        const agent = AgentFactory.getAgent(step.agentType);
        if (!agent) {
          throw new Error(`智能体 ${step.agentType} 不存在`);
        }

        // 准备智能体输入
        const agentInput: AgentInput = {
          ...step.input,
          context,
          userProfile,
        };

        // 为特定智能体动态填充必要信息
        if (step.agentType === 'curriculum-designer') {
          if (!agentInput.data.topic && context.subject) {
            agentInput.data.topic = context.subject;
          }
          if (!agentInput.data.learningGoals && context.learningGoals) {
            agentInput.data.learningGoals = context.learningGoals;
          }
          if (!agentInput.data.difficulty && context.difficulty) {
            agentInput.data.difficulty = context.difficulty;
          }
          if (!agentInput.data.timeConstraints && context.timeConstraints) {
            agentInput.data.timeConstraints = context.timeConstraints;
          }
        } else if (step.agentType === 'assessment-expert') {
          if (!agentInput.data.content && context.subject) {
            agentInput.data.content = context.subject;
          }
          if (!agentInput.data.objectives && context.learningGoals) {
            agentInput.data.objectives = context.learningGoals;
          }
          // 确保至少有基本的评估信息
          if (!agentInput.data.content && !agentInput.data.objectives) {
            agentInput.data.content = '通用学习内容';
            agentInput.data.objectives = ['理解基本概念', '应用所学知识'];
          }
        } else if (step.agentType === 'content-generator') {
          if (!agentInput.data.topic && context.subject) {
            agentInput.data.topic = context.subject;
          }
          if (!agentInput.data.requirements && context.learningGoals) {
            agentInput.data.requirements = context.learningGoals;
          }
          if (!agentInput.data.difficulty && context.difficulty) {
            agentInput.data.difficulty = context.difficulty;
          }
        } else if (step.agentType === 'activity-designer') {
          if (!agentInput.data.topic && context.subject) {
            agentInput.data.topic = context.subject;
          }
          if (!agentInput.data.objectives && context.learningGoals) {
            agentInput.data.objectives = context.learningGoals;
          }
          if (!agentInput.data.difficulty && context.difficulty) {
            agentInput.data.difficulty = context.difficulty;
          }
        }

        // 执行智能体任务
        const output = await agent.process(agentInput);
        results.push(output);

        // 累计统计
        totalTokens += output.metadata.tokensUsed || 0;
        agentContributions[agent.id] = (agentContributions[agent.id] || 0) + 1;
      }

      // 生成最终学习结果
      const finalOutput = this.synthesizeFinalResult(workflow, results, context);

      return {
        workflowId,
        results,
        finalOutput,
        metadata: {
          totalTime: Date.now() - startTime,
          totalTokens,
          agentContributions,
        },
      };
    } catch (error) {
      console.error('工作流执行失败:', error);
      throw error;
    }
  }

  /**
   * 协调智能体协作
   */
  async coordinateAgents(
    agents: BaseAgent[], 
    task: AgentInput,
    userProfile?: LearnerProfile
  ): Promise<CollaborationResult> {
    const startTime = Date.now();
    const results: AgentOutput[] = [];
    let totalTokens = 0;
    const agentContributions: Record<string, number> = {};

    // 并行执行所有智能体
    const promises = agents.map(async (agent) => {
      const output = await agent.process({
        ...task,
        userProfile,
      });
      
      totalTokens += output.metadata.tokensUsed || 0;
      agentContributions[agent.id] = (agentContributions[agent.id] || 0) + 1;
      
      return output;
    });

    const outputs = await Promise.all(promises);
    results.push(...outputs);

    // 综合所有智能体的输出
    const finalOutput = this.synthesizeCollaborativeResult(agents, results, task);

    return {
      workflowId: `collaboration-${Date.now()}`,
      results,
      finalOutput,
      metadata: {
        totalTime: Date.now() - startTime,
        totalTokens,
        agentContributions,
      },
    };
  }

  /**
   * 综合最终学习结果
   */
  private synthesizeFinalResult(
    workflow: LearningWorkflow,
    results: AgentOutput[],
    context: LearningContext
  ): LearningResult {
    const content = results.map(r => r.content).join('\n\n');
    
    return {
      id: `result-${Date.now()}`,
      type: 'lesson',
      title: `${workflow.name} - 学习结果`,
      content,
      difficulty: context.difficulty || 5,
      estimatedTime: workflow.expectedDuration,
      prerequisites: context.priorKnowledge || [],
      learningObjectives: context.learningGoals || [],
      agentContributions: results,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 综合协作结果
   */
  private synthesizeCollaborativeResult(
    agents: BaseAgent[],
    results: AgentOutput[],
    task: AgentInput
  ): LearningResult {
    const content = this.mergeAgentOutputs(results);
    
    return {
      id: `collaboration-result-${Date.now()}`,
      type: 'lesson',
      title: '多智能体协作结果',
      content,
      difficulty: 5,
      estimatedTime: 30,
      prerequisites: [],
      learningObjectives: [],
      agentContributions: results,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * 合并智能体输出
   */
  private mergeAgentOutputs(outputs: AgentOutput[]): string {
    return outputs.map(output => {
      return `## ${output.agentType} 的建议\n\n${output.content}`;
    }).join('\n\n---\n\n');
  }
}

// 导出单例实例
export const orchestrator = new AgentOrchestrator();

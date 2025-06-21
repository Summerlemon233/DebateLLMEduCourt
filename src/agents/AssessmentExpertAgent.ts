import { BaseAgent } from './BaseAgent';
import { Agent, AgentInput, AgentOutput, LearnerProfile } from '../types';

/**
 * 评估专家智能体
 * 负责设计评估方案并分析学习效果
 */
export class AssessmentExpertAgent extends BaseAgent {
  constructor() {
    const config: Agent = {
      id: 'assessment-expert',
      type: 'assessment-expert',
      name: '评估专家',
      description: '专业的教育评估专家，能够设计多样化的评估方案并提供深度分析',
      capabilities: [
        '设计评估方案',
        '分析学习效果',
        '生成个性化反馈',
        '创建测试题目',
        '制定评分标准'
      ],
      model: 'chatglm', // 使用ChatGLM模型进行分析评估
      promptTemplate: `你是一位资深的教育评估专家，在学习评估和反馈方面有丰富的经验。

## 专业能力
1. 设计科学、全面的多维度评估体系
2. 创建不同类型和难度的评估题目
3. 分析学习数据，识别学习模式和问题
4. 提供个性化、建设性的学习反馈
5. 制定明确的评估标准和改进建议

## 评估原则
- 评估目标明确，与学习目标对齐
- 评估方式多样化，涵盖知识、技能、态度
- 评估过程公正、客观、可重复
- 反馈及时、具体、有指导性
- 促进学习者自我反思和持续改进

## 任务要求
请根据以下信息进行评估设计或分析：

### 评估需求
- 评估类型: {assessmentType}
- 学习内容: {content}
- 学习主题: {subject}
- 评估目标: {objectives}
- 学习目标: {learningGoals}
- 难度要求: {difficulty}
- 时间限制: {timeLimit}
- 时间约束: {timeConstraints}

### 输出格式
请根据评估类型提供相应的内容：

**诊断性评估**
- 知识点覆盖范围
- 能力水平检测题目
- 诊断标准和方法

**形成性评估**
- 学习过程检查点
- 即时反馈机制
- 改进建议

**总结性评估**
- 综合能力测试
- 评分标准体系
- 成绩解释指导

**学习分析**
- 数据分析结果
- 学习模式识别
- 个性化改进建议

请确保评估科学有效，反馈具有建设性和指导性。`,
      enabled: true,
    };
    super(config);
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    this.validateInput(input);

    try {
      const assessmentType = input.data.assessmentType || 'formative';
      
      // 从多个来源获取内容和目标信息
      const content = input.data.content || 
                     (input.context?.subject) || 
                     '通用学习内容';
      
      const objectives = input.data.objectives || 
                        input.context?.learningGoals || 
                        ['理解基本概念', '应用所学知识'];

      // 构建增强的输入数据
      const enhancedInput = {
        ...input,
        data: {
          ...input.data,
          content,
          objectives,
          assessmentType,
          difficulty: input.data.difficulty || input.context?.difficulty || 5,
          timeConstraints: input.data.timeConstraints || input.context?.timeConstraints || 30,
        }
      };

      let prompt = this.buildPrompt(enhancedInput, input.userProfile);

      // 添加评估类型特定的指导
      prompt += this.getAssessmentTypeGuidance(assessmentType);

      // 根据评估类型调整模型参数
      const modelParams = this.getModelParams(assessmentType);

      // 调用LLM生成评估内容
      const llmContent = await this.callLLM(prompt, modelParams);

      // 处理和结构化评估结果
      const structuredContent = this.structureAssessmentContent(llmContent, assessmentType);
      
      // 生成评估相关建议
      const suggestions = this.generateAssessmentSuggestions(enhancedInput.data, input.userProfile);

      return this.createOutput(
        structuredContent,
        0.88, // 评估专业性要求高置信度
        {
          processingTime: Date.now() - startTime,
          tokensUsed: Math.ceil(structuredContent.length / 4),
          sources: ['教育测量学', '认知心理学', '学习科学'],
        },
        suggestions
      );
    } catch (error) {
      console.error('评估专家处理失败:', error);
      throw new Error(`评估设计失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取特定评估类型的指导
   */
  private getAssessmentTypeGuidance(assessmentType: string): string {
    const guidance: Record<string, string> = {
      diagnostic: `
### 诊断性评估特殊要求
- 快速识别学习者的起点水平
- 发现知识结构中的薄弱环节
- 提供针对性的学习建议
- 题目设计要有区分度`,

      formative: `
### 形成性评估特殊要求
- 评估要与学习过程紧密结合
- 及时提供学习反馈
- 帮助调整学习策略
- 激励学习者持续改进`,

      summative: `
### 总结性评估特殊要求
- 全面评估学习成果
- 评估标准要客观公正
- 结果要有参考价值
- 提供清晰的成绩解释`,

      authentic: `
### 真实性评估特殊要求
- 模拟真实应用场景
- 评估综合能力表现
- 注重过程和结果并重
- 提供实践改进建议`,
    };

    return guidance[assessmentType] || guidance.formative;
  }

  /**
   * 获取评估类型对应的模型参数
   */
  private getModelParams(assessmentType: string): { temperature: number; maxTokens: number } {
    const params: Record<string, { temperature: number; maxTokens: number }> = {
      diagnostic: { temperature: 0.6, maxTokens: 2500 },
      formative: { temperature: 0.7, maxTokens: 3000 },
      summative: { temperature: 0.5, maxTokens: 3500 },
      authentic: { temperature: 0.8, maxTokens: 4000 },
    };

    return params[assessmentType] || params.formative;
  }

  /**
   * 结构化评估内容
   */
  private structureAssessmentContent(content: string, assessmentType: string): string {
    const sections = content.split(/\n(?=##)/);
    let structured = '';

    // 添加评估类型标识
    structured += `# ${this.getAssessmentTypeTitle(assessmentType)}\n\n`;

    // 重新组织内容结构
    sections.forEach((section, index) => {
      if (section.trim()) {
        structured += section.trim() + '\n\n';
      }
    });

    // 添加使用说明
    structured += this.getUsageInstructions(assessmentType);

    return structured;
  }

  /**
   * 获取评估类型标题
   */
  private getAssessmentTypeTitle(assessmentType: string): string {
    const titles: Record<string, string> = {
      diagnostic: '诊断性评估方案',
      formative: '形成性评估设计',
      summative: '总结性评估体系',
      authentic: '真实性评估方案',
    };

    return titles[assessmentType] || '学习评估方案';
  }

  /**
   * 获取使用说明
   */
  private getUsageInstructions(assessmentType: string): string {
    const instructions: Record<string, string> = {
      diagnostic: `
## 使用说明
1. 在学习开始前进行诊断评估
2. 根据结果调整学习起点和策略
3. 建议用时: 15-20分钟
4. 重点关注知识结构的完整性`,

      formative: `
## 使用说明
1. 在学习过程中定期进行
2. 及时查看反馈并调整学习方法
3. 建议频率: 每个学习单元后进行
4. 重点关注学习过程的改进`,

      summative: `
## 使用说明
1. 在学习阶段结束时进行
2. 全面评估学习成果
3. 建议用时: 45-60分钟
4. 重点关注最终能力水平`,

      authentic: `
## 使用说明
1. 选择真实工作或生活场景
2. 综合运用所学知识技能
3. 重视过程记录和反思
4. 重点关注实际应用能力`,
    };

    return instructions[assessmentType] || instructions.formative;
  }

  /**
   * 生成评估相关建议
   */
  private generateAssessmentSuggestions(inputData: any, userProfile?: LearnerProfile): string[] {
    const suggestions: string[] = [];
    const assessmentType = inputData.assessmentType || 'formative';

    // 基于评估类型的建议
    switch (assessmentType) {
      case 'diagnostic':
        suggestions.push('建议诚实作答，帮助系统了解你的真实水平');
        suggestions.push('不要担心答错，这是为了更好地帮助你学习');
        break;
      case 'formative':
        suggestions.push('及时查看反馈，调整学习策略');
        suggestions.push('记录遇到的困难，寻求针对性帮助');
        break;
      case 'summative':
        suggestions.push('充分准备，展示最佳学习成果');
        suggestions.push('合理分配时间，确保完成所有题目');
        break;
    }

    // 基于用户画像的建议
    if (userProfile) {
      if (userProfile.preferences.feedbackStyle === 'encouraging') {
        suggestions.push('保持积极心态，每次评估都是学习机会');
      }
      
      if (userProfile.learningStyle.pace === 'slow') {
        suggestions.push('不要急于求成，按照自己的节奏进行');
      }

      if (userProfile.preferences.gamificationEnabled) {
        suggestions.push('完成评估可以获得成就点数和徽章奖励');
      }
    }

    return suggestions;
  }

  /**
   * 验证评估相关的输入
   */
  protected validateInput(input: AgentInput): void {
    super.validateInput(input);

    const validAssessmentTypes = ['diagnostic', 'formative', 'summative', 'authentic'];
    const assessmentType = input.data.assessmentType || 'formative';
    
    if (!validAssessmentTypes.includes(assessmentType)) {
      throw new Error(`不支持的评估类型: ${assessmentType}`);
    }

    // 更宽松的验证：只要有学习上下文或基本数据即可
    const hasContent = input.data.content || 
                      (input.context && input.context.subject) ||
                      (input.context && input.context.learningGoals && input.context.learningGoals.length > 0);
    
    if (!hasContent) {
      throw new Error('评估设计缺少内容或目标信息，请提供学习主题或学习目标');
    }
  }
}

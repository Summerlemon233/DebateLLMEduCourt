import { BaseAgent } from './BaseAgent';
import { Agent, AgentInput, AgentOutput, LearnerProfile } from '../types';

/**
 * 课程设计师智能体
 * 负责根据学习目标和用户画像设计个性化学习路径
 */
export class CurriculumDesignerAgent extends BaseAgent {
  constructor() {
    const config: Agent = {
      id: 'curriculum-designer',
      type: 'curriculum-designer',
      name: '课程设计师',
      description: '专业的教育课程设计专家，能够根据学习者的背景和目标设计个性化的学习路径',
      capabilities: [
        '分析学习者需求',
        '设计学习路径',
        '制定学习计划',
        '调整课程难度',
        '设定学习里程碑'
      ],
      model: 'deepseek', // 使用DeepSeek模型进行逻辑推理
      promptTemplate: `你是一位经验丰富的教育课程设计专家，具备以下专业能力：

## 专业能力
1. 深入分析学习者的知识水平、学习风格和学习目标
2. 设计科学合理、循序渐进的个性化学习路径
3. 制定明确的学习里程碑和检查点
4. 根据学习进度动态调整课程难度和内容
5. 融合多种教学理论和最佳实践

## 设计原则
- 以学习者为中心，充分考虑个体差异
- 遵循认知负荷理论，合理控制学习难度
- 采用建构主义方法，注重知识建构过程
- 运用多元智能理论，提供多样化学习方式
- 确保学习目标明确、可测量、可达成

## 任务要求
请根据以下信息设计详细的个性化学习方案：

### 学习需求
- 学习主题: {topic}
- 学习目标: {learningGoals}
- 时间限制: {timeConstraints}
- 难度要求: {difficulty}

### 输出格式
请提供以下结构化内容：

**1. 学习路径概览**
- 总体规划和时间安排
- 主要学习阶段划分

**2. 详细学习计划**
- 每个阶段的具体内容
- 预估学习时长
- 难度递进方式
- 必要的先修知识

**3. 学习里程碑**
- 关键检查点设置
- 评估标准和方法
- 成果展示要求

**4. 个性化建议**
- 基于学习者特征的专门建议
- 学习策略和方法指导
- 可能的挑战和应对方案

请确保设计方案科学合理、具有可操作性，并充分体现个性化特色。`,
      enabled: true,
    };
    super(config);
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    this.validateInput(input);

    try {
      // 构建专业化提示词
      const prompt = this.buildPrompt(input, input.userProfile);
      
      // 调用LLM生成课程设计
      const content = await this.callLLM(prompt, {
        temperature: 0.7,
        maxTokens: 3000,
      });

      // 分析生成的内容，提取关键信息
      const suggestions = this.extractSuggestions(content, input.userProfile);

      return this.createOutput(
        content,
        0.9, // 高置信度，因为是专业课程设计
        {
          processingTime: Date.now() - startTime,
          tokensUsed: Math.ceil(content.length / 4), // 估算token使用量
          sources: ['教育学理论', '认知科学', '学习心理学'],
        },
        suggestions
      );
    } catch (error) {
      console.error('课程设计师处理失败:', error);
      throw new Error(`课程设计失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 从生成内容中提取个性化建议
   */
  private extractSuggestions(content: string, userProfile?: LearnerProfile): string[] {
    const suggestions: string[] = [];

    if (userProfile) {
      // 根据学习风格提供建议
      switch (userProfile.learningStyle.visualAuditory) {
        case 'visual':
          suggestions.push('建议使用图表、思维导图等视觉工具辅助学习');
          break;
        case 'auditory':
          suggestions.push('建议多听讲座、音频材料，或与他人讨论学习内容');
          break;
        case 'kinesthetic':
          suggestions.push('建议通过实践操作、实验等动手方式加深理解');
          break;
      }

      // 根据学习节奏提供建议
      switch (userProfile.learningStyle.pace) {
        case 'fast':
          suggestions.push('可以适当增加学习强度，挑战更高难度的内容');
          break;
        case 'slow':
          suggestions.push('建议放慢学习节奏，充分消化每个知识点');
          break;
        default:
          suggestions.push('保持当前学习节奏，注意劳逸结合');
      }

      // 根据偏好内容格式提供建议
      if (userProfile.preferences.contentFormat.includes('interactive')) {
        suggestions.push('推荐参与互动式学习活动，提高学习参与度');
      }
    }

    return suggestions;
  }

  /**
   * 验证课程设计相关的输入
   */
  protected validateInput(input: AgentInput): void {
    super.validateInput(input);

    const requiredFields = ['topic', 'learningGoals'];
    for (const field of requiredFields) {
      if (!input.data[field]) {
        throw new Error(`课程设计缺少必要字段: ${field}`);
      }
    }

    // 验证学习目标格式
    if (!Array.isArray(input.data.learningGoals) && typeof input.data.learningGoals !== 'string') {
      throw new Error('学习目标必须是字符串或字符串数组');
    }
  }
}

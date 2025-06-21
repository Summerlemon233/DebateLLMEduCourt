import { BaseAgent } from './BaseAgent';
import { Agent, AgentInput, AgentOutput, LearnerProfile } from '../types';

/**
 * 活动设计师智能体
 * 负责创建互动学习活动和实践练习
 */
export class ActivityDesignerAgent extends BaseAgent {
  constructor() {
    const config: Agent = {
      id: 'activity-designer',
      type: 'activity-designer',
      name: '活动设计师',
      description: '专业的教学活动设计专家，能够创建富有吸引力和教育价值的学习活动',
      capabilities: [
        '设计互动活动',
        '创建实践练习',
        '开发游戏化元素',
        '设计协作任务',
        '制作模拟场景'
      ],
      model: 'hunyuan', // 使用混元模型进行创意设计
      promptTemplate: `你是一位富有创造力的教学活动设计专家，擅长设计各种吸引人且有效的学习活动。

## 专业能力
1. 设计符合教学目标的互动学习活动
2. 创建实践性强、参与度高的练习任务
3. 开发游戏化学习元素，提升学习动机
4. 设计协作学习活动，促进交流互动
5. 制作真实场景模拟，增强应用能力

## 设计原则
- 活动目标明确，与学习目标紧密对齐
- 参与性强，能够调动学习者积极性
- 操作简单，易于理解和执行
- 反馈及时，学习者能够获得即时反馈
- 趣味性与教育性并重，寓教于乐

## 任务要求
请根据以下需求设计创新的学习活动：

### 活动需求
- 活动类型: {activityType}
- 学习主题: {topic}
- 目标能力: {targetSkills}
- 参与人数: {participants}
- 活动时长: {duration}
- 难度等级: {difficulty}

### 输出格式
请提供以下完整的活动设计：

**1. 活动概览**
- 活动名称和简介
- 学习目标和预期成果
- 所需时间和资源

**2. 活动流程**
- 详细的步骤说明
- 每个环节的时间安排
- 参与者的具体任务

**3. 互动机制**
- 参与方式和规则
- 协作或竞争元素
- 反馈和评价机制

**4. 实施建议**
- 准备工作清单
- 常见问题及解决方案
- 效果评估方法

**5. 拓展活动**
- 进阶版本设计
- 相关主题活动
- 持续学习建议

请确保活动设计富有创意、操作性强，能够有效促进学习目标的达成。`,
      enabled: true,
    };
    super(config);
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    this.validateInput(input);

    try {
      const activityType = input.data.activityType || 'interactive';
      let prompt = this.buildPrompt(input, input.userProfile);

      // 添加活动类型特定的设计指导
      prompt += this.getActivityTypeGuidance(activityType);

      // 根据用户画像调整活动设计风格
      if (input.userProfile) {
        prompt += this.getUserPreferenceGuidance(input.userProfile);
      }

      // 调用LLM生成活动设计
      const content = await this.callLLM(prompt, {
        temperature: 0.9, // 高创造性
        maxTokens: 4000,
      });

      // 优化活动设计格式
      const optimizedContent = this.optimizeActivityDesign(content, input.data);
      
      // 生成活动实施建议
      const suggestions = this.generateActivitySuggestions(input.data, input.userProfile);

      return this.createOutput(
        optimizedContent,
        0.82,
        {
          processingTime: Date.now() - startTime,
          tokensUsed: Math.ceil(optimizedContent.length / 4),
          sources: ['教育游戏理论', '体验学习法', '建构主义教学'],
        },
        suggestions
      );
    } catch (error) {
      console.error('活动设计师处理失败:', error);
      throw new Error(`活动设计失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取活动类型特定的设计指导
   */
  private getActivityTypeGuidance(activityType: string): string {
    const guidance: Record<string, string> = {
      interactive: `
### 互动活动设计要点
- 设计多种互动形式，保持参与度
- 创建即时反馈机制
- 平衡个人思考和集体讨论
- 设置适当的挑战程度`,

      collaborative: `
### 协作活动设计要点
- 明确分工，确保每个人都有贡献
- 设计需要团队合作的任务
- 建立有效的交流机制
- 创建共同目标和成就感`,

      simulation: `
### 模拟活动设计要点
- 创建真实可信的场景
- 提供明确的角色设定
- 设计决策点和后果反馈
- 包含反思和总结环节`,

      gamified: `
### 游戏化活动设计要点
- 设置清晰的游戏规则
- 建立进度和成就系统
- 平衡竞争与合作元素
- 确保游戏性不掩盖学习目标`,

      project: `
### 项目活动设计要点
- 定义明确的项目目标
- 分解为可管理的阶段
- 提供必要的资源和工具
- 建立里程碑和检查点`,
    };

    return guidance[activityType] || guidance.interactive;
  }

  /**
   * 根据用户偏好生成指导
   */
  private getUserPreferenceGuidance(userProfile: LearnerProfile): string {
    let guidance = '\n### 个性化设计建议\n';

    // 基于学习风格
    switch (userProfile.learningStyle.visualAuditory) {
      case 'visual':
        guidance += '- 增加视觉元素：图表、图像、颜色编码\n';
        break;
      case 'auditory':
        guidance += '- 增加听觉元素：讨论、音频、口头解释\n';
        break;
      case 'kinesthetic':
        guidance += '- 增加动手元素：操作、实验、体感活动\n';
        break;
    }

    // 基于学习节奏
    if (userProfile.learningStyle.pace === 'fast') {
      guidance += '- 提供额外挑战和扩展活动\n';
    } else if (userProfile.learningStyle.pace === 'slow') {
      guidance += '- 分解为更小的步骤，提供更多支持\n';
    }

    // 基于游戏化偏好
    if (userProfile.preferences.gamificationEnabled) {
      guidance += '- 强化游戏化元素：积分、徽章、排行榜\n';
    }

    return guidance;
  }

  /**
   * 优化活动设计格式
   */
  private optimizeActivityDesign(content: string, inputData: any): string {
    let optimized = content;

    // 确保活动有清晰的时间标识
    const duration = inputData.duration || '30分钟';
    if (!optimized.includes('时间') && !optimized.includes('分钟')) {
      optimized = `**建议用时**: ${duration}\n\n` + optimized;
    }

    // 添加难度标识
    const difficulty = inputData.difficulty || 5;
    const difficultyText = difficulty <= 3 ? '初级' : difficulty <= 7 ? '中级' : '高级';
    if (!optimized.includes('难度')) {
      optimized = `**难度级别**: ${difficultyText}\n\n` + optimized;
    }

    // 确保有参与人数说明
    const participants = inputData.participants || '个人';
    if (!optimized.includes('参与') && participants !== '个人') {
      optimized = `**参与方式**: ${participants}\n\n` + optimized;
    }

    // 添加活动标签
    const activityType = inputData.activityType || 'interactive';
    optimized = `**活动类型**: ${this.getActivityTypeLabel(activityType)}\n\n` + optimized;

    return optimized;
  }

  /**
   * 获取活动类型标签
   */
  private getActivityTypeLabel(activityType: string): string {
    const labels: Record<string, string> = {
      interactive: '互动学习',
      collaborative: '协作学习',
      simulation: '模拟体验',
      gamified: '游戏化学习',
      project: '项目学习',
      debate: '辩论讨论',
      case_study: '案例分析',
      role_play: '角色扮演',
    };

    return labels[activityType] || '学习活动';
  }

  /**
   * 生成活动实施建议
   */
  private generateActivitySuggestions(inputData: any, userProfile?: LearnerProfile): string[] {
    const suggestions: string[] = [];
    const activityType = inputData.activityType || 'interactive';

    // 基于活动类型的建议
    switch (activityType) {
      case 'collaborative':
        suggestions.push('建议提前分配角色，确保团队协作顺利');
        suggestions.push('注意倾听他人观点，尊重不同意见');
        break;
      case 'simulation':
        suggestions.push('认真扮演分配的角色，投入情境');
        suggestions.push('记录重要决策和结果，便于后续反思');
        break;
      case 'gamified':
        suggestions.push('专注于学习目标，不要只关注游戏分数');
        suggestions.push('可以与同伴良性竞争，互相促进');
        break;
      case 'project':
        suggestions.push('制定详细的时间计划，按步骤执行');
        suggestions.push('及时记录进展和遇到的问题');
        break;
    }

    // 基于用户画像的建议
    if (userProfile) {
      if (userProfile.learningStyle.processingStyle === 'global') {
        suggestions.push('先了解活动的整体框架，再关注具体细节');
      }
      
      if (userProfile.preferences.feedbackStyle === 'detailed') {
        suggestions.push('积极寻求详细反馈，深入理解每个环节');
      }

      if (userProfile.learningStyle.pace === 'fast') {
        suggestions.push('可以尝试活动的扩展版本或额外挑战');
      }
    }

    // 通用建议
    suggestions.push('保持开放心态，勇于尝试和表达');
    suggestions.push('活动结束后进行反思总结，巩固学习成果');

    return suggestions;
  }

  /**
   * 验证活动设计相关的输入
   */
  protected validateInput(input: AgentInput): void {
    super.validateInput(input);

    if (!input.data.topic) {
      throw new Error('活动设计缺少主题信息');
    }

    const validActivityTypes = [
      'interactive', 'collaborative', 'simulation', 'gamified', 
      'project', 'debate', 'case_study', 'role_play'
    ];
    const activityType = input.data.activityType || 'interactive';
    
    if (!validActivityTypes.includes(activityType)) {
      throw new Error(`不支持的活动类型: ${activityType}`);
    }

    // 验证时长格式
    if (input.data.duration && typeof input.data.duration !== 'string') {
      throw new Error('活动时长必须是字符串格式，如"30分钟"');
    }
  }
}

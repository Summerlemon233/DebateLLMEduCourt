import { BaseAgent } from './BaseAgent';
import { Agent, AgentInput, AgentOutput, LearnerProfile } from '../types';

/**
 * 内容生成器智能体
 * 负责根据课程设计生成具体的学习材料和内容
 */
export class ContentGeneratorAgent extends BaseAgent {
  constructor() {
    const config: Agent = {
      id: 'content-generator',
      type: 'content-generator',
      name: '内容生成器',
      description: '专业的教学内容生成专家，能够创建高质量、个性化的学习材料',
      capabilities: [
        '生成教学内容',
        '创建练习题目',
        '设计案例研究',
        '制作学习材料',
        '调整内容难度'
      ],
      model: 'qwen', // 使用Qwen模型进行内容生成
      promptTemplate: `你是一位专业的教育内容生成专家，擅长创建各种类型的高质量学习材料。

## 专业能力
1. 根据学习目标生成结构化、系统性的教学内容
2. 创建不同难度级别的练习题和测试材料
3. 设计贴近实际的案例研究和应用场景
4. 制作多媒体学习资源的文本内容
5. 确保内容的准确性、时效性和教育价值

## 内容创作原则
- 内容准确、权威，引用可靠来源
- 结构清晰、逻辑合理，易于理解
- 语言生动、通俗易懂，适合目标受众
- 理论结合实践，注重应用性
- 循序渐进，符合认知规律

## 任务要求
请根据以下需求生成高质量的学习内容：

### 内容需求
- 内容类型: {contentType}
- 主题: {topic}
- 难度级别: {difficulty}
- 目标受众: {targetAudience}
- 内容长度: {contentLength}
- 学习目标: {learningObjectives}

### 输出格式
请按照以下结构组织内容：

**1. 内容概览**
- 主要知识点总结
- 学习重点和难点

**2. 详细内容**
- 核心概念解释
- 具体知识点阐述
- 相关示例和案例

**3. 实践应用**
- 实际应用场景
- 练习题目或思考问题
- 延伸学习建议

**4. 总结回顾**
- 关键要点梳理
- 与先前知识的联系
- 后续学习指导

请确保内容质量高、实用性强，并充分考虑学习者的个性化需求。`,
      enabled: true,
    };
    super(config);
  }

  async process(input: AgentInput): Promise<AgentOutput> {
    const startTime = Date.now();
    this.validateInput(input);

    try {
      // 根据内容类型选择不同的生成策略
      const contentType = input.data.contentType || 'lesson';
      let prompt = this.buildPrompt(input, input.userProfile);

      // 添加特定内容类型的指导
      prompt += this.getContentTypeGuidance(contentType);

      // 调用LLM生成内容
      const content = await this.callLLM(prompt, {
        temperature: 0.8, // 适中的创造性
        maxTokens: 4000,
      });

      // 后处理：优化内容格式和质量
      const optimizedContent = this.optimizeContent(content, input.data);
      
      // 生成相关建议
      const suggestions = this.generateContentSuggestions(input.data, input.userProfile);

      return this.createOutput(
        optimizedContent,
        0.85,
        {
          processingTime: Date.now() - startTime,
          tokensUsed: Math.ceil(optimizedContent.length / 4),
          sources: ['教育资源库', '专业教材', '最新研究成果'],
        },
        suggestions
      );
    } catch (error) {
      console.error('内容生成器处理失败:', error);
      throw new Error(`内容生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 获取特定内容类型的生成指导
   */
  private getContentTypeGuidance(contentType: string): string {
    const guidance: Record<string, string> = {
      lesson: `
### 课程内容特殊要求
- 确保知识点的逻辑性和连贯性
- 提供充分的示例和类比
- 设置思考问题促进深度学习
- 包含自测题目检验理解`,

      exercise: `
### 练习题目特殊要求
- 题目难度要适中，有层次性
- 提供详细的解答步骤
- 包含常见错误分析
- 给出拓展思考方向`,

      case_study: `
### 案例研究特殊要求
- 选择真实、典型的案例
- 提供充分的背景信息
- 设置开放性讨论问题
- 指导分析方法和框架`,

      assessment: `
### 评估材料特殊要求
- 题目覆盖主要知识点
- 难度分布合理
- 评分标准明确
- 包含反馈机制`,
    };

    return guidance[contentType] || guidance.lesson;
  }

  /**
   * 优化生成的内容
   */
  private optimizeContent(content: string, inputData: any): string {
    // 确保内容有适当的段落分割
    let optimized = content.replace(/\n{3,}/g, '\n\n');
    
    // 确保标题格式统一
    optimized = optimized.replace(/^(\d+\.\s*[^#])/gm, '## $1');
    
    // 为重要概念添加强调
    optimized = optimized.replace(/\*\*([^*]+)\*\*/g, '**$1**');
    
    // 确保代码块格式正确
    optimized = optimized.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `\`\`\`${lang || ''}\n${code.trim()}\n\`\`\``;
    });

    return optimized;
  }

  /**
   * 生成内容相关的学习建议
   */
  private generateContentSuggestions(inputData: any, userProfile?: LearnerProfile): string[] {
    const suggestions: string[] = [];
    const contentType = inputData.contentType || 'lesson';

    // 基于内容类型的建议
    switch (contentType) {
      case 'lesson':
        suggestions.push('建议先整体浏览，再逐段深入学习');
        suggestions.push('学习过程中记录重点和疑问');
        break;
      case 'exercise':
        suggestions.push('先独立思考，再查看解答');
        suggestions.push('分析错误原因，总结解题方法');
        break;
      case 'case_study':
        suggestions.push('结合自己的经验思考案例');
        suggestions.push('尝试从多角度分析问题');
        break;
    }

    // 基于用户画像的建议
    if (userProfile) {
      if (userProfile.preferences.feedbackStyle === 'detailed') {
        suggestions.push('可以深入探索每个知识点的细节');
      }
      
      if (userProfile.learningStyle.processingStyle === 'global') {
        suggestions.push('建议先掌握整体框架，再学习具体细节');
      }
    }

    return suggestions;
  }

  /**
   * 验证内容生成相关的输入
   */
  protected validateInput(input: AgentInput): void {
    super.validateInput(input);

    if (!input.data.topic) {
      throw new Error('内容生成缺少主题信息');
    }

    const validContentTypes = ['lesson', 'exercise', 'case_study', 'assessment', 'summary'];
    const contentType = input.data.contentType || 'lesson';
    
    if (!validContentTypes.includes(contentType)) {
      throw new Error(`不支持的内容类型: ${contentType}`);
    }
  }
}

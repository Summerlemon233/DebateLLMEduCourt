import { NextApiRequest, NextApiResponse } from 'next';
import { AgentFactory, orchestrator } from '../../src/agents/BaseAgent';
import { LearningContext, AgentInput, LearnerProfile, LearningResult } from '../../src/types';

/**
 * 多智能体学习API
 * 处理多智能体协作学习请求
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持POST请求' });
  }

  try {
    const { 
      workflowType,
      mode, // 添加mode字段支持
      topic,
      learningGoals,
      difficulty = 5,
      timeConstraints,
      contentType = 'lesson',
      userProfile,
      agentTypes
    } = req.body;

    // 统一处理workflowType和mode字段
    const actualWorkflowType = workflowType || mode;

    // 验证必要参数
    if (!topic || !topic.trim()) {
      return res.status(400).json({ 
        error: '缺少必要参数：学习主题',
        required: ['topic']
      });
    }

    // 处理学习目标 - 如果为空，生成默认目标
    let processedGoals = learningGoals;
    if (!learningGoals || (Array.isArray(learningGoals) && learningGoals.length === 0)) {
      processedGoals = [`掌握${topic}的基础知识`, `理解${topic}的核心概念`, `能够应用${topic}解决实际问题`];
    } else if (typeof learningGoals === 'string') {
      processedGoals = learningGoals.split('\n').filter(goal => goal.trim()).map(goal => goal.trim());
      if (processedGoals.length === 0) {
        processedGoals = [`掌握${topic}的基础知识`, `理解${topic}的核心概念`, `能够应用${topic}解决实际问题`];
      }
    }

    // 初始化智能体（如果还没有初始化）
    await AgentFactory.initializeCoreAgents();

    // 构建学习上下文
    const context: LearningContext = {
      sessionId: `session-${Date.now()}`,
      learningGoals: processedGoals,
      subject: topic,
      difficulty,
      timeConstraints,
      priorKnowledge: userProfile?.knowledgeMap ? 
        Object.keys(userProfile.knowledgeMap) : undefined,
    };

    let result;

    if (actualWorkflowType === 'single' || actualWorkflowType === 'single-agent') {
      // 单智能体处理
      result = await handleSingleAgent(req.body, context, userProfile);
    } else if (actualWorkflowType === 'collaborative') {
      // 多智能体协作
      result = await handleCollaborativeAgents(req.body, context, userProfile);
    } else {
      // 预定义工作流
      result = await handleWorkflow(actualWorkflowType, context, userProfile);
    }

    res.status(200).json({
      success: true,
      result,
      context,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('多智能体学习API错误:', error);
    res.status(500).json({
      error: '多智能体学习处理失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
}

/**
 * 处理单智能体请求
 */
async function handleSingleAgent(
  requestData: any,
  context: LearningContext,
  userProfile?: LearnerProfile
) {
  const { agentType, topic, contentType = 'curriculum-design', additionalData } = requestData;
  
  const agent = AgentFactory.getAgentsByType(agentType)[0];
  if (!agent) {
    throw new Error(`智能体类型 ${agentType} 不存在`);
  }

  const input: AgentInput = {
    type: contentType,
    data: {
      topic,
      contentType,
      difficulty: context.difficulty,
      learningGoals: context.learningGoals,
      timeConstraints: context.timeConstraints,
      ...additionalData,
    },
    context,
    userProfile,
  };

  const output = await agent.process(input);
  
  // 构建符合LearningResult格式的返回数据
  const learningResult: LearningResult = {
    id: `result-${Date.now()}`,
    type: contentType as any,
    title: `${topic} - ${agentType}学习内容`,
    content: output.content,
    difficulty: context.difficulty,
    estimatedTime: context.timeConstraints || 30,
    prerequisites: [],
    learningObjectives: context.learningGoals,
    agentContributions: [output],
    createdAt: new Date().toISOString(),
  };
  
  return learningResult;
}

/**
 * 处理多智能体协作请求
 */
async function handleCollaborativeAgents(
  requestData: any,
  context: LearningContext,
  userProfile?: LearnerProfile
) {
  const { agentTypes, topic, contentType, additionalData } = requestData;
  
  if (!agentTypes || !Array.isArray(agentTypes)) {
    throw new Error('协作模式需要指定智能体类型数组');
  }

  const agents = agentTypes.map((type: string) => {
    const agentList = AgentFactory.getAgentsByType(type as any);
    if (agentList.length === 0) {
      throw new Error(`智能体类型 ${type} 不存在`);
    }
    return agentList[0];
  });

  const task: AgentInput = {
    type: contentType,
    data: {
      topic,
      contentType,
      difficulty: context.difficulty,
      learningGoals: context.learningGoals,
      timeConstraints: context.timeConstraints,
      ...additionalData,
    },
    context,
    userProfile,
  };

  const result = await orchestrator.coordinateAgents(agents, task, userProfile);
  
  // 构建符合LearningResult格式的返回数据
  const learningResult: LearningResult = {
    id: `result-${Date.now()}`,
    type: 'lesson',
    title: `${topic} - 多智能体协作学习`,
    content: result.results.map((output: any) => output.content).join('\n\n'),
    difficulty: context.difficulty,
    estimatedTime: context.timeConstraints || 45,
    prerequisites: [],
    learningObjectives: context.learningGoals,
    agentContributions: result.results,
    createdAt: new Date().toISOString(),
  };
  
  return learningResult;
}

/**
 * 处理预定义工作流
 */
async function handleWorkflow(
  workflowType: string,
  context: LearningContext,
  userProfile?: LearnerProfile
) {
  // 注册预定义工作流
  registerPredefinedWorkflows();
  
  const result = await orchestrator.executeWorkflow(workflowType, context, userProfile);
  
  // 构建符合LearningResult格式的返回数据
  const learningResult: LearningResult = {
    id: `result-${Date.now()}`,
    type: 'lesson',
    title: `${context.subject} - ${workflowType}工作流`,
    content: result.results.map((output: any) => output.content).join('\n\n'),
    difficulty: context.difficulty,
    estimatedTime: context.timeConstraints || 60,
    prerequisites: [],
    learningObjectives: context.learningGoals,
    agentContributions: result.results,
    createdAt: new Date().toISOString(),
  };
  
  return learningResult;
}

/**
 * 注册预定义学习工作流
 */
function registerPredefinedWorkflows() {
  // 完整学习工作流
  orchestrator.registerWorkflow({
    id: 'complete-learning',
    name: '完整学习流程',
    description: '从课程设计到评估的完整学习体验',
    agents: [], // 将在执行时动态获取
    steps: [
      {
        id: 'step-1',
        name: '课程设计',
        agentType: 'curriculum-designer',
        input: {
          type: 'curriculum-design',
          data: {},
        },
        dependencies: [],
        parallel: false,
      },
      {
        id: 'step-2',
        name: '内容生成',
        agentType: 'content-generator',
        input: {
          type: 'content-generation',
          data: {},
        },
        dependencies: ['step-1'],
        parallel: false,
      },
      {
        id: 'step-3',
        name: '活动设计',
        agentType: 'activity-designer',
        input: {
          type: 'activity-design',
          data: {},
        },
        dependencies: ['step-2'],
        parallel: false,
      },
      {
        id: 'step-4',
        name: '评估设计',
        agentType: 'assessment-expert',
        input: {
          type: 'assessment-design',
          data: {
            assessmentType: 'formative',
            content: '', // 将从依赖步骤获取
            objectives: [], // 将从学习目标获取
          },
        },
        dependencies: ['step-2'],
        parallel: true,
      },
    ],
    expectedDuration: 300, // 5分钟
  });

  // 快速内容生成工作流
  orchestrator.registerWorkflow({
    id: 'quick-content',
    name: '快速内容生成',
    description: '快速生成学习内容和练习',
    agents: [],
    steps: [
      {
        id: 'step-1',
        name: '内容生成',
        agentType: 'content-generator',
        input: {
          type: 'content-generation',
          data: {},
        },
        dependencies: [],
        parallel: false,
      },
      {
        id: 'step-2',
        name: '活动设计',
        agentType: 'activity-designer',
        input: {
          type: 'activity-design',
          data: {},
        },
        dependencies: ['step-1'],
        parallel: false,
      },
    ],
    expectedDuration: 120, // 2分钟
  });

  // 评估导向工作流
  orchestrator.registerWorkflow({
    id: 'assessment-focused',
    name: '评估导向学习',
    description: '以评估为核心的学习设计',
    agents: [],
    steps: [
      {
        id: 'step-1',
        name: '评估设计',
        agentType: 'assessment-expert',
        input: {
          type: 'assessment-design',
          data: { 
            assessmentType: 'diagnostic',
            content: '', // 将从学习主题获取
            objectives: [], // 将从学习上下文获取
          },
        },
        dependencies: [],
        parallel: false,
      },
      {
        id: 'step-2',
        name: '课程设计',
        agentType: 'curriculum-designer',
        input: {
          type: 'curriculum-design',
          data: {},
        },
        dependencies: ['step-1'],
        parallel: false,
      },
      {
        id: 'step-3',
        name: '内容生成',
        agentType: 'content-generator',
        input: {
          type: 'content-generation',
          data: {},
        },
        dependencies: ['step-2'],
        parallel: false,
      },
    ],
    expectedDuration: 240, // 4分钟
  });
}

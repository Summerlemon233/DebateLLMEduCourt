// 基础类型定义

export interface LLMProvider {
  name: string;
  id: string;
  description: string;
  enabled: boolean;
}

export interface DebateRequest {
  question: string;
  models: string[]; // 修改为与后端匹配
  config?: ModelConfig;
  eotStrategy?: EoTStrategy; // 添加EoT策略选项
  teacherPersonas?: { [modelId: string]: string }; // 添加教师人格化支持
}

export interface LLMResponse {
  model: string; // 修改为与后端匹配
  content: string;
  timestamp: string; // 修改为字符串类型
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTime: number;
}

export interface DebateStage {
  stage: number; // 修改为数字
  title: string;
  description: string;
  responses: LLMResponse[];
  startTime: string;
  endTime: string;
  duration: number;
}

export interface DebateResult {
  question: string;
  models: string[];
  stages: DebateStage[];
  summary: string;
  timestamp: string;
  duration: number;
}

export interface LoadingState {
  isLoading: boolean;
  currentStage: 'initial' | 'refined' | 'final' | null;
  currentModel: string | null;
  progress: number;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  temperature: number;
  apiEndpoint?: string;
  enabled: boolean;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
}

// LLM客户端接口
export interface LLMClient {
  modelId: string;
  call(prompt: string, options?: LLMCallOptions): Promise<LLMResponse>;
  isAvailable(): boolean;
}

export interface LLMCallOptions {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  timeout?: number;
}

// 前端组件Props
export interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

export interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModels: string[];
  onModelChange: (selectedModels: string[]) => void;
  disabled: boolean;
}

export interface LoadingIndicatorProps {
  loadingState: LoadingState;
}

export interface ResultDisplayProps {
  result: DebateResult | null;
  isLoading: boolean;
}

// 阶段更新回调类型
export interface StageUpdateCallback {
  (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string): void;
}

// 阶段完成回调类型
export interface StageCompleteCallback {
  (stageNumber: number, stageData: DebateStage): void;
}

export interface DebateRequestWithCallback extends DebateRequest {
  onStageUpdate?: StageUpdateCallback;
}

// API响应类型
export interface DebateApiResponse {
  success: boolean;
  data?: DebateResult;
  error?: string;
  timestamp: string;
}

// EoT策略类型定义
export type EoTStrategy = 'debate' | 'memory' | 'report' | 'relay';

export interface EoTStrategyConfig {
  strategy: EoTStrategy;
  name: string;
  description: string;
  stages: number;
  communicationPattern: string;
}

// 教师人格化系统类型定义
export interface TeacherPersonaConfig {
  [modelId: string]: string; // modelId -> teacherPersonaId
}

export interface EnhancedDebateRequest extends DebateRequest {
  teacherPersonas?: TeacherPersonaConfig;
}

// 多智能体系统类型定义
export interface Agent {
  id: string;
  type: AgentType;
  name: string;
  description: string;
  capabilities: string[];
  model: string; // 使用的LLM模型
  promptTemplate: string;
  enabled: boolean;
  avatar?: string; // 头像颜色或图标
}

export type AgentType = 
  | 'curriculum-designer'
  | 'content-generator' 
  | 'assessment-expert'
  | 'activity-designer'
  | 'learning-analyst'
  | 'tutor-agent'
  | 'peer-learner'
  | 'reflection-guide';

export interface AgentInput {
  type: string;
  data: any;
  context?: LearningContext;
  userProfile?: LearnerProfile;
}

export interface AgentOutput {
  agentId: string;
  agentType: AgentType;
  content: string;
  confidence: number;
  metadata: {
    tokensUsed?: number;
    processingTime: number;
    sources?: string[];
  };
  suggestions?: string[];
}

export interface LearningWorkflow {
  id: string;
  name: string;
  description: string;
  agents: Agent[];
  steps: WorkflowStep[];
  expectedDuration: number;
}

export interface WorkflowStep {
  id: string;
  name: string;
  agentType: AgentType;
  input: AgentInput;
  dependencies: string[];
  parallel: boolean;
}

export interface CollaborationResult {
  workflowId: string;
  results: AgentOutput[];
  finalOutput: LearningResult;
  metadata: {
    totalTime: number;
    totalTokens: number;
    agentContributions: Record<string, number>;
  };
}

export interface LearningContext {
  sessionId: string;
  learningGoals: string[];
  subject: string;
  difficulty: number;
  timeConstraints?: number;
  priorKnowledge?: string[];
}

export interface LearningResult {
  id: string;
  type: 'lesson' | 'assessment' | 'activity' | 'feedback';
  title: string;
  content: string;
  difficulty: number;
  estimatedTime: number;
  prerequisites: string[];
  learningObjectives: string[];
  agentContributions: AgentOutput[];
  createdAt: string;
}

// 学习者画像相关类型
export interface LearnerProfile {
  userId: string;
  
  // 基础信息
  demographics: {
    age?: number;
    education?: string;
    background?: string[];
    timezone?: string;
  };
  
  // 学习特征
  learningStyle: {
    visualAuditory: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    processingStyle: 'sequential' | 'global' | 'mixed';
    pace: 'fast' | 'moderate' | 'slow';
    preferredTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
  };
  
  // 知识地图
  knowledgeMap: Record<string, {
    level: number; // 1-10
    masteredConcepts: string[];
    weakAreas: string[];
    interests: string[];
    lastAssessed: string;
  }>;
  
  // 学习偏好
  preferences: {
    contentFormat: ('text' | 'video' | 'interactive' | 'audio')[];
    sessionLength: number; // 分钟
    difficultyPreference: 'challenge' | 'comfortable' | 'easy';
    feedbackStyle: 'detailed' | 'concise' | 'encouraging';
    gamificationEnabled: boolean;
  };
  
  // 学习历史
  learningHistory: {
    totalSessions: number;
    totalTimeSpent: number; // 分钟
    completedLessons: string[];
    achievements: string[];
    streakDays: number;
    lastActive: string;
    averageSessionLength: number;
  };
  
  // 动态数据
  currentGoals: LearningGoal[];
  recentPerformance: PerformanceMetrics;
  adaptationSettings: AdaptationSettings;
  
  createdAt: string;
  updatedAt: string;
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  subject: string;
  targetLevel: number;
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0-100
  milestones: Milestone[];
  createdAt: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  completedAt?: string;
  requiredActions: string[];
}

export interface PerformanceMetrics {
  accuracy: number; // 0-100
  consistency: number; // 0-100
  engagement: number; // 0-100
  improvement: number; // -100 to 100
  recentScores: number[];
  strongAreas: string[];
  improvementAreas: string[];
  lastCalculated: string;
}

export interface AdaptationSettings {
  contentDifficulty: number; // 1-10
  explanationDetail: 'brief' | 'moderate' | 'detailed';
  practiceFrequency: 'low' | 'medium' | 'high';
  challengeLevel: 'safe' | 'moderate' | 'aggressive';
  reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
}

// 个性化推荐相关
export interface Recommendation {
  id: string;
  type: 'lesson' | 'practice' | 'review' | 'challenge';
  title: string;
  description: string;
  reason: string;
  priority: number; // 1-10
  estimatedTime: number;
  difficulty: number;
  subject: string;
  learningObjectives: string[];
  createdAt: string;
  expiresAt?: string;
}

// 学习推荐相关类型
export interface LearningRecommendation {
  id: string;
  type: 'content' | 'practice' | 'collaboration' | 'achievement';
  title: string;
  description: string;
  reason: string;
  confidence: number; // 0-1之间的置信度
  difficulty: number; // 1-10的难度等级
  estimatedTime: number; // 预估学习时间（分钟）
  agentId?: string; // 推荐该内容的智能体ID
  metadata?: Record<string, any>;
  createdAt: string;
}

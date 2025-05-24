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

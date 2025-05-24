// 基础类型定义

export interface LLMProvider {
  name: string;
  id: string;
  description: string;
  enabled: boolean;
}

export interface DebateRequest {
  question: string;
  selectedModels: string[];
  verifierModel: string;
}

export interface LLMResponse {
  modelId: string;
  modelName: string;
  content: string;
  timestamp: number;
  success: boolean;
  error?: string;
}

export interface DebateStage {
  stage: 'initial' | 'refined' | 'final';
  responses: LLMResponse[];
  timestamp: number;
}

export interface DebateResult {
  question: string;
  stages: {
    initial: DebateStage;
    refined: DebateStage;
    final: DebateStage;
  };
  duration: number;
  success: boolean;
  error?: string;
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
  isVerifier: boolean;
  isDebater: boolean;
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
  verifierModel: string;
  onModelChange: (selectedModels: string[]) => void;
  onVerifierChange: (verifierModel: string) => void;
  disabled: boolean;
}

export interface LoadingIndicatorProps {
  loadingState: LoadingState;
}

export interface ResultDisplayProps {
  result: DebateResult | null;
  isLoading: boolean;
}

// API响应类型
export interface DebateApiResponse {
  success: boolean;
  data?: DebateResult;
  error?: ApiError;
}

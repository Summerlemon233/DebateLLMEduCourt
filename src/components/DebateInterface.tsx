import React from 'react';
import { Layout } from 'antd';
import QuestionInput from './QuestionInput';
import ModelSelector from './ModelSelector';
import LoadingIndicator from './LoadingIndicator';
import ResultDisplay from './ResultDisplay';
import type { 
  DebateResult, 
  LoadingState, 
  ModelConfig,
  QuestionInputProps,
  ModelSelectorProps,
  LoadingIndicatorProps,
  ResultDisplayProps
} from '@/types';

const { Content } = Layout;

interface DebateInterfaceProps {
  // 问题输入相关
  onQuestionSubmit: QuestionInputProps['onSubmit'];
  
  // 模型选择相关
  models: ModelConfig[];
  selectedModels: string[];
  onModelChange: ModelSelectorProps['onModelChange'];
  
  // 状态相关
  loadingState: LoadingState;
  debateResult: DebateResult | null;
}

/**
 * 辩论接口主组件
 * 整合所有子组件，提供完整的辩论界面
 */
const DebateInterface: React.FC<DebateInterfaceProps> = ({
  onQuestionSubmit,
  models,
  selectedModels,
  onModelChange,
  loadingState,
  debateResult,
}) => {
  return (
    <Content style={{ padding: '24px' }}>
      {/* 问题输入区域 */}
      <div style={{ marginBottom: '32px' }}>
        <QuestionInput
          onSubmit={onQuestionSubmit}
          isLoading={loadingState.isLoading}
          placeholder="请输入您想要探讨的问题，例如：人工智能对教育的影响是什么？"
        />
      </div>

      {/* 模型选择区域 */}
      <div style={{ marginBottom: '32px' }}>
        <ModelSelector
          models={models}
          selectedModels={selectedModels}
          onModelChange={onModelChange}
          disabled={loadingState.isLoading}
        />
      </div>

      {/* 加载指示器 */}
      {loadingState.isLoading && (
        <div style={{ marginBottom: '32px' }}>
          <LoadingIndicator loadingState={loadingState} />
        </div>
      )}

      {/* 结果展示 */}
      <ResultDisplay
        result={debateResult}
        isLoading={loadingState.isLoading}
      />
    </Content>
  );
};

export default DebateInterface;

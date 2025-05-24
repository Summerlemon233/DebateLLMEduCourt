import React, { useState } from 'react';
import Head from 'next/head';
import { Layout, message } from 'antd';
import { RobotOutlined, BulbOutlined } from '@ant-design/icons';

import QuestionInput from '../src/components/QuestionInput';
import ModelSelector from '../src/components/ModelSelector';
import LoadingIndicator from '../src/components/LoadingIndicator';
import ResultDisplay from '../src/components/ResultDisplay';

import { startDebate } from '../src/utils/api';
import type { 
  DebateResult, 
  LoadingState, 
  ModelConfig,
  DebateRequest 
} from '../src/types';

const { Header, Content } = Layout;

// 预定义的模型配置
const DEFAULT_MODELS: ModelConfig[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'DeepSeek',
    description: '深度求索模型，在代码和逻辑推理方面表现优秀',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
  {
    id: 'qwen',
    name: 'Qwen (通义千问)',
    provider: 'Alibaba',
    description: '阿里云通义千问，中文理解能力强',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
  {
    id: 'doubao',
    name: 'Doubao (豆包)',
    provider: 'ByteDance',
    description: '字节跳动豆包，具有良好的对话能力',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
  {
    id: 'chatglm',
    name: 'ChatGLM',
    provider: 'Zhipu AI',
    description: '智谱AI的ChatGLM模型，支持中英文对话',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
  {
    id: 'hunyuan',
    name: 'Tencent Hunyuan',
    provider: 'Tencent',
    description: '腾讯混元大模型，中文能力优秀',
    maxTokens: 4096,
    temperature: 0.7,
    enabled: true,
  },
];

export default function HomePage() {
  // 状态管理
  const [selectedModels, setSelectedModels] = useState<string[]>(['deepseek', 'qwen', 'hunyuan']);
  const [debateResult, setDebateResult] = useState<DebateResult | null>(null);
  const [partialResult, setPartialResult] = useState<DebateResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    currentStage: null,
    currentModel: null,
    progress: 0,
  });

  // 处理问题提交
  const handleQuestionSubmit = async (question: string) => {
    if (!question.trim()) {
      message.error('请输入一个问题');
      return;
    }

    if (selectedModels.length < 2) {
      message.error('请至少选择2个辩论模型');
      return;
    }

    // 重置状态
    setDebateResult(null);
    setPartialResult(null);
    setLoadingState({
      isLoading: true,
      currentStage: 'initial',
      currentModel: null,
      progress: 0,
    });

    try {
      const request: DebateRequest = {
        question: question.trim(),
        models: selectedModels,
      };

      // 阶段更新回调
      const handleStageUpdate = (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string, message?: string) => {
        console.log('🔄 [Frontend] ========== Stage Update Received ==========');
        console.log('🔄 [Frontend] Received parameters:', { stage, progress, currentModel, message });
        console.log('🔄 [Frontend] Call timestamp:', new Date().toISOString());
        console.log('🔍 [Frontend] Previous loading state:', JSON.stringify(loadingState, null, 2));
        
        // 验证参数
        if (typeof progress !== 'number' || isNaN(progress)) {
          console.error('❌ [Frontend] Invalid progress value:', progress);
          return;
        }
        
        if (!['initial', 'refined', 'final'].includes(stage)) {
          console.error('❌ [Frontend] Invalid stage value:', stage);
          return;
        }
        
        console.log('✅ [Frontend] Parameters validation passed');
        
        setLoadingState(prev => {
          console.log('🔧 [Frontend] Current state in setState:', JSON.stringify(prev, null, 2));
          
          const newState = {
            ...prev,
            currentStage: stage,
            progress: Math.round(progress),
            currentModel: currentModel || null,
          };
          
          console.log('🔧 [Frontend] New state to be set:', JSON.stringify(newState, null, 2));
          console.log('🔧 [Frontend] State changes:');
          console.log(`    - Stage: ${prev.currentStage} → ${newState.currentStage}`);
          console.log(`    - Progress: ${prev.progress}% → ${newState.progress}%`);
          console.log(`    - Model: ${prev.currentModel} → ${newState.currentModel}`);
          
          return newState;
        });
        
        // 延迟检查状态是否真的更新了
        setTimeout(() => {
          console.log('⏰ [Frontend] Post-update loading state check:', JSON.stringify(loadingState, null, 2));
        }, 100);
        
        console.log('✅ [Frontend] Stage update callback completed');
        console.log('🔄 [Frontend] ==========================================');
      };

      // 阶段完成回调
      const handleStageComplete = (stageNumber: number, stageData: any) => {
        console.log(`🎯 [Frontend] ========== Stage ${stageNumber} Complete ==========`);
        console.log('📊 [Frontend] Stage data received:', stageData);
        
        setPartialResult(prev => {
          const newResult: DebateResult = prev || {
            question: request.question,
            models: request.models,
            stages: [],
            summary: '',
            timestamp: new Date().toISOString(),
            duration: 0
          };
          
          // 创建新的stages数组，确保按顺序添加
          const updatedStages = [...newResult.stages];
          
          // 确保阶段按顺序存储
          const stageIndex = stageNumber - 1;
          if (stageIndex >= 0) {
            updatedStages[stageIndex] = stageData;
          }
          
          console.log(`✅ [Frontend] Updated partial result with stage ${stageNumber}`);
          console.log('📊 [Frontend] Current stages count:', updatedStages.length);
          
          return {
            ...newResult,
            stages: updatedStages
          };
        });
        
        console.log(`🎯 [Frontend] ==========================================`);
      };

      // 发起辩论请求
      const result = await startDebate(request, handleStageUpdate, handleStageComplete);

      // 设置结果
      setDebateResult(result);
      setLoadingState({
        isLoading: false,
        currentStage: null,
        currentModel: null,
        progress: 100,
      });

      message.success('辩论完成！');
    } catch (error) {
      console.error('Debate error:', error);
      
      setLoadingState({
        isLoading: false,
        currentStage: null,
        currentModel: null,
        progress: 0,
      });

      const errorMessage = error instanceof Error ? error.message : '辩论过程中发生错误';
      message.error(errorMessage);
    }
  };

  // 处理模型选择变化
  const handleModelChange = (models: string[]) => {
    setSelectedModels(models);
  };

  return (
    <>
      <Head>
        <title>多LLM辩论教育平台</title>
        <meta name="description" content="通过多个AI模型的辩论，帮助您更好地理解复杂问题" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="app-container">
        <Layout className="main-content">
          {/* 头部 */}
          <Header className="app-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
              <RobotOutlined style={{ fontSize: '2rem' }} />
              <div>
                <h1>多LLM辩论教育平台</h1>
                <p>
                  <BulbOutlined style={{ marginRight: '8px' }} />
                  通过AI模型间的辩论与审视，获得更全面、准确的答案
                </p>
              </div>
            </div>
          </Header>

          {/* 主要内容 */}
          <Content className="app-content">
            {/* 问题输入区域 */}
            <div className="question-section">
              <h2>🤔 提出您的问题</h2>
              <QuestionInput
                onSubmit={handleQuestionSubmit}
                isLoading={loadingState.isLoading}
                placeholder="请输入您想要探讨的问题，例如：人工智能对教育的影响是什么？"
              />
            </div>

            {/* 模型选择区域 */}
            <div className="model-selector-section">
              <ModelSelector
                models={DEFAULT_MODELS}
                selectedModels={selectedModels}
                onModelChange={handleModelChange}
                disabled={loadingState.isLoading}
              />
            </div>

            {/* 加载指示器 */}
            {loadingState.isLoading && (
              <LoadingIndicator loadingState={loadingState} />
            )}

            {/* 结果展示 */}
            <ResultDisplay
              result={debateResult || partialResult}
              isLoading={loadingState.isLoading}
            />
          </Content>
        </Layout>
      </div>
    </>
  );
}

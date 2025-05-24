import React, { useState } from 'react';
import Head from 'next/head';
import { Layout, message, Switch, Tooltip } from 'antd';
import { RobotOutlined, BulbOutlined, ThunderboltOutlined } from '@ant-design/icons';

import QuestionInput from '@/components/QuestionInput';
import ModelSelector from '@/components/ModelSelector';
import LoadingIndicator from '@/components/LoadingIndicator';
import ResultDisplay from '@/components/ResultDisplay';

import { startDebate, startStreamingDebate } from '@/utils/api';
import type { 
  DebateResult, 
  LoadingState, 
  ModelConfig,
  DebateRequest,
  RealtimeDebateResult,
  DebateUpdateEvent
} from '@/types';

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
  const [debateResult, setDebateResult] = useState<RealtimeDebateResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    currentStage: null,
    currentModel: null,
    progress: 0,
  });
  const [useStreamingMode, setUseStreamingMode] = useState<boolean>(true);

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

    // 初始化实时辩论结果
    const initialResult: RealtimeDebateResult = {
      question: question.trim(),
      models: selectedModels,
      stages: [],
      currentStage: 0,
      isComplete: false,
      timestamp: new Date().toISOString(),
      duration: 0,
    };

    setDebateResult(initialResult);
    setLoadingState({
      isLoading: true,
      currentStage: 'initial',
      currentModel: null,
      progress: 0,
    });

    const startTime = Date.now();

    try {
      const request: DebateRequest = {
        question: question.trim(),
        models: selectedModels,
      };

      if (useStreamingMode) {
        // 启动流式辩论
        await startStreamingDebate(request, (event: DebateUpdateEvent) => {
          console.log('Debate update:', event);
          
          setDebateResult(prev => {
            if (!prev) return prev;
            
            const updated = { ...prev };
            updated.duration = Date.now() - startTime;

            switch (event.type) {
              case 'stage_start':
                updated.currentStage = event.stageNumber;
                setLoadingState(prevLoading => ({
                  ...prevLoading,
                  currentStage: event.stageNumber === 1 ? 'initial' : 
                               event.stageNumber === 2 ? 'refined' : 'final',
                  progress: (event.stageNumber - 1) * 30,
                }));
                break;

              case 'model_response':
                if (event.response && event.model) {
                  // 确保阶段存在
                  while (updated.stages.length < event.stageNumber) {
                    updated.stages.push({
                      stage: updated.stages.length + 1,
                      title: getStageTitle(updated.stages.length + 1),
                      description: getStageDescription(updated.stages.length + 1),
                      responses: [],
                      startTime: new Date().toISOString(),
                      endTime: '',
                      duration: 0
                    });
                  }

                  const stageIndex = event.stageNumber - 1;
                  const stage = updated.stages[stageIndex];
                  
                  // 检查是否已经有这个模型的响应
                  const existingIndex = stage.responses.findIndex(r => r.model === event.model);
                  if (existingIndex >= 0) {
                    stage.responses[existingIndex] = event.response;
                  } else {
                    stage.responses.push(event.response);
                  }

                  setLoadingState(prevLoading => ({
                    ...prevLoading,
                    currentModel: event.model || null,
                    progress: Math.min(
                      (event.stageNumber - 1) * 30 + 
                      (stage.responses.length / selectedModels.length) * 30,
                      90
                    ),
                  }));
                }
                break;

              case 'stage_complete':
                if (event.stage) {
                  const stageIndex = event.stageNumber - 1;
                  if (updated.stages[stageIndex]) {
                    updated.stages[stageIndex] = event.stage;
                  }
                }
                break;

              case 'debate_complete':
                updated.isComplete = true;
                updated.summary = event.summary;
                setLoadingState({
                  isLoading: false,
                  currentStage: null,
                  currentModel: null,
                  progress: 100,
                });
                message.success('辩论完成！');
                break;
            }

            return updated;
          });
        });
      } else {
        // 使用传统模式
        const progressInterval = setInterval(() => {
          setLoadingState(prev => ({
            ...prev,
            progress: Math.min(prev.progress + Math.random() * 10, 90),
          }));
        }, 1000);

        const result = await startDebate(request);
        clearInterval(progressInterval);

        // 转换为实时结果格式
        const realtimeResult: RealtimeDebateResult = {
          ...result,
          isComplete: true,
          currentStage: result.stages.length,
        };

        setDebateResult(realtimeResult);
        setLoadingState({
          isLoading: false,
          currentStage: null,
          currentModel: null,
          progress: 100,
        });

        message.success('辩论完成！');
      }

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

  // 获取阶段标题
  const getStageTitle = (stageNumber: number): string => {
    const titles = [
      '🎯 阶段一：初始提案',
      '🔄 阶段二：交叉审视与修正', 
      '✅ 阶段三：最终验证与综合'
    ];
    return titles[stageNumber - 1] || `阶段${stageNumber}`;
  };

  // 获取阶段描述
  const getStageDescription = (stageNumber: number): string => {
    const descriptions = [
      '各个AI模型基于问题独立提供初始回答',
      '模型们互相审视其他模型的回答，并对自己的答案进行修正和优化',
      '综合所有观点，提供最终的准确答案'
    ];
    return descriptions[stageNumber - 1] || `阶段${stageNumber}描述`;
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

            {/* 实时模式开关 */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 20px',
                background: '#f8f9fa',
                borderRadius: '20px',
                border: '1px solid #e1e5e9'
              }}>
                <ThunderboltOutlined style={{ color: useStreamingMode ? '#52c41a' : '#999' }} />
                <span style={{ fontSize: '14px', color: '#666' }}>实时模式</span>
                <Tooltip title={useStreamingMode ? '开启实时显示，模型回复后立即显示' : '关闭实时显示，等待所有模型完成后统一显示'}>
                  <Switch
                    checked={useStreamingMode}
                    onChange={setUseStreamingMode}
                    disabled={loadingState.isLoading}
                    checkedChildren="ON"
                    unCheckedChildren="OFF"
                  />
                </Tooltip>
              </div>
            </div>

            {/* 加载指示器 */}
            {loadingState.isLoading && (
              <LoadingIndicator loadingState={loadingState} />
            )}

            {/* 结果展示 */}
            <ResultDisplay
              result={debateResult}
              isLoading={loadingState.isLoading}
            />
          </Content>
        </Layout>
      </div>
    </>
  );
}

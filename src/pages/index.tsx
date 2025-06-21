import React, { useState } from 'react';
import Head from 'next/head';
import { Layout, message } from 'antd';
import { RobotOutlined, BulbOutlined } from '@ant-design/icons';

import QuestionInput from '@/components/QuestionInput';
import ModelSelector from '@/components/ModelSelector';
import TeacherSelector from '@/components/TeacherSelector';
import LoadingIndicator from '@/components/LoadingIndicator';
import ResultDisplay from '@/components/ResultDisplay';

import { startDebate } from '@/utils/api';
import { TeacherSelectionState } from '@/utils/teacherPersonas';
import type { 
  DebateResult, 
  LoadingState, 
  ModelConfig,
  DebateRequest 
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
  const [teacherSelection, setTeacherSelection] = useState<TeacherSelectionState>({});
  const [debateResult, setDebateResult] = useState<DebateResult | null>(null);
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
        teacherPersonas: teacherSelection, // 添加教师人格化信息
      };

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setLoadingState(prev => ({
          ...prev,
          progress: Math.min(prev.progress + Math.random() * 10, 90),
        }));
      }, 1000);

      // 发起辩论请求
      const result = await startDebate(request);

      // 清除进度更新
      clearInterval(progressInterval);

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

  // 处理教师选择变化
  const handleTeacherSelectionChange = (selection: TeacherSelectionState) => {
    setTeacherSelection(selection);
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

            {/* 教师选择区域 */}
            <div className="teacher-selector-section">
              <TeacherSelector 
                models={DEFAULT_MODELS}
                selectedModels={selectedModels}
                onTeacherSelectionChange={handleTeacherSelectionChange}
                disabled={loadingState.isLoading}
              />
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

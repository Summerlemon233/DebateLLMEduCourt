import React, { useState, useCallback } from 'react';
import Head from 'next/head';
import { Layout, message, Switch, Tooltip } from 'antd';
import { RobotOutlined, BulbOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { flushSync } from 'react-dom';

import QuestionInput from '../src/components/QuestionInput';
import ModelSelector from '../src/components/ModelSelector';
import LoadingIndicator from '../src/components/LoadingIndicator';
import ResultDisplay from '../src/components/ResultDisplay';

import { startDebate, startStreamingDebate } from '../src/utils/api';
import type { 
  DebateResult, 
  LoadingState, 
  ModelConfig,
  DebateRequest,
  RealtimeDebateResult,
  DebateUpdateEvent
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
  const [debateResult, setDebateResult] = useState<RealtimeDebateResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    currentStage: null,
    currentModel: null,
    progress: 0,
  });
  const [useStreamingMode, setUseStreamingMode] = useState<boolean>(true);
  const [forceRenderCounter, setForceRenderCounter] = useState<number>(0); // 强制重新渲染计数器
  const [renderedStages, setRenderedStages] = useState<Set<number>>(new Set()); // 跟踪已渲染的阶段

  // 强制重新渲染的函数
  const forceRerender = useCallback(() => {
    flushSync(() => {
      setForceRenderCounter(prev => prev + 1);
    });
  }, []);

  // 渲染确认函数 - 确保阶段内容已经渲染到DOM
  const confirmStageRendered = useCallback(async (stageNumber: number, responses: any[]): Promise<boolean> => {
    return new Promise((resolve) => {
      // 强制同步更新状态
      flushSync(() => {
        setDebateResult(prev => {
          if (!prev) return prev;
          const updated = { ...prev };
          updated.currentStage = stageNumber;
          
          // 确保阶段存在且有响应
          while (updated.stages.length < stageNumber) {
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
          
          // 更新对应阶段的响应
          const stageIndex = stageNumber - 1;
          if (updated.stages[stageIndex] && responses.length > 0) {
            updated.stages[stageIndex].responses = [...responses];
            updated.stages[stageIndex].endTime = new Date().toISOString();
          }
          
          console.log(`✅ 强制更新阶段 ${stageNumber}，响应数量：${responses.length}`);
          return updated;
        });
        
        setForceRenderCounter(prev => prev + 1);
      });
      
      // 使用setTimeout确保DOM已更新
      setTimeout(() => {
        // 验证渲染是否成功
        const hasRendered = document.querySelector(`[data-stage="${stageNumber}"]`) !== null;
        console.log(`🔍 验证阶段 ${stageNumber} 渲染状态:`, hasRendered);
        
        if (hasRendered) {
          setRenderedStages(prev => new Set([...prev, stageNumber]));
        }
        
        resolve(hasRendered);
      }, 100); // 给React一些时间完成渲染
    });
  }, []);

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

  // 简化的状态更新函数
  const updateDebateResult = useCallback((updater: (prev: RealtimeDebateResult | null) => RealtimeDebateResult | null) => {
    flushSync(() => {
      setDebateResult(updater);
    });
    forceRerender();
  }, [forceRerender]);

  const updateLoadingState = useCallback((updater: (prev: LoadingState) => LoadingState) => {
    flushSync(() => {
      setLoadingState(updater);
    });
  }, []);

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
        console.log('🚀 启动流式辩论模式');
        // 启动流式辩论
        await startStreamingDebate(request, (event: DebateUpdateEvent) => {
          console.log('� 前端收到流式事件:', event.type, `阶段${event.stageNumber}`, event.model || '');
          console.log('🔥 完整事件数据:', JSON.stringify(event, null, 2));
          
          // 处理阶段开始事件
          if (event.type === 'stage_start') {
            console.log(`🎬 开始阶段 ${event.stageNumber}`);
            
            updateDebateResult(prev => {
              if (!prev) return prev;
              const updated = { ...prev };
              updated.currentStage = event.stageNumber;
              updated.duration = Date.now() - startTime;
              
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
              
              console.log(`✅ 更新到阶段 ${updated.currentStage}, 总阶段数: ${updated.stages.length}`);
              return updated;
            });
            
            updateLoadingState(prev => ({
              ...prev,
              currentStage: event.stageNumber === 1 ? 'initial' : 
                          event.stageNumber === 2 ? 'refined' : 'final',
              progress: (event.stageNumber - 1) * 30,
            }));
          }
          
          // 处理模型响应事件
          else if (event.type === 'model_response' && event.response && event.model) {
            console.log(`🤖 模型 ${event.model} 在阶段 ${event.stageNumber} 响应完成`);
            
            updateDebateResult(prev => {
              if (!prev) return prev;
              const updated = { ...prev };
              updated.duration = Date.now() - startTime;
              
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
              if (existingIndex >= 0 && event.response) {
                stage.responses[existingIndex] = event.response;
              } else if (event.response) {
                stage.responses.push(event.response);
              }
              
              console.log(`✅ 阶段 ${event.stageNumber} 现在有 ${stage.responses.length} 个响应`);
              return updated;
            });
          }
          
          // 处理阶段完成事件 - 关键：必须立即显示结果并确认渲染
          else if (event.type === 'stage_complete' && event.stage) {
            console.log(`🏁 阶段 ${event.stageNumber} 完成，立即显示结果！`);
            
            const stageData = event.stage;
            const stageNumber = event.stageNumber;
            
            // 立即确认阶段渲染
            confirmStageRendered(stageNumber, stageData.responses).then(renderSuccess => {
              if (renderSuccess) {
                console.log(`✅ 阶段 ${stageNumber} 渲染确认成功`);
                
                updateLoadingState(prev => ({
                  ...prev,
                  progress: Math.min(stageNumber * 30, 90)
                }));
                
                // 显示阶段完成提示
                message.success(`阶段 ${stageNumber} 完成并已显示，共 ${stageData.responses.length} 个响应`);
              } else {
                console.error(`❌ 阶段 ${stageNumber} 渲染失败，停止继续处理`);
                message.error(`阶段 ${stageNumber} 显示失败，请刷新页面重试`);
              }
            });
          }
          
          // 处理辩论完成事件
          else if (event.type === 'debate_complete') {
            console.log('🎉 整个辩论完成!');
            
            updateDebateResult(prev => {
              if (!prev) return prev;
              const updated = { ...prev };
              updated.isComplete = true;
              updated.summary = event.summary;
              updated.duration = Date.now() - startTime;
              console.log('✅ 设置辩论完成状态');
              return updated;
            });
            
            updateLoadingState(prev => ({
              ...prev,
              isLoading: false,
              currentStage: null,
              currentModel: null,
              progress: 100,
            }));
            
            message.success('辩论完成！');
          }
        });
        console.log('✅ 流式辩论完成');
      } else {
        console.log('🔄 使用传统辩论模式');
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

        updateDebateResult(() => realtimeResult);
        updateLoadingState(() => ({
          isLoading: false,
          currentStage: null,
          currentModel: null,
          progress: 100,
        }));

        message.success('辩论完成！');
      }

    } catch (error) {
      console.error('Debate error:', error);
      
      updateLoadingState(() => ({
        isLoading: false,
        currentStage: null,
        currentModel: null,
        progress: 0,
      }));

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
                placeholder="请输入您想要探讨的问题。"
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
              key={`result-${forceRenderCounter}-${debateResult?.currentStage || 0}-${debateResult?.stages?.length || 0}`}
              result={debateResult}
              isLoading={loadingState.isLoading}
            />
          </Content>
        </Layout>
      </div>
    </>
  );
}

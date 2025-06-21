import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Layout, message, Tooltip } from 'antd';
import { motion } from 'framer-motion';
import { 
  RobotOutlined, 
  BulbOutlined, 
  QuestionCircleOutlined, 
  ApiOutlined
} from '@ant-design/icons';

import ParticleBackground from '../src/components/ParticleBackground';
import AppHeader from '../src/components/Header';
import AccessibilityToolbar from '../src/components/AccessibilityToolbar';

import QuestionInput from '../src/components/QuestionInput';
import ModelSelector from '../src/components/ModelSelector';
import TeacherSelector from '../src/components/TeacherSelector';
import EoTSelector from '../src/components/EoTSelector';
import LoadingIndicator from '../src/components/LoadingIndicator';
import ResultDisplay from '../src/components/ResultDisplay';
import GamificationPanel from '../src/components/GamificationPanel';

import { startDebate, startEoTReasoning, startEoTReasoningWithStream } from '../src/utils/api';
import { TeacherSelectionState } from '../src/utils/teacherPersonas';
import { GamificationManager, GamificationEvent } from '../src/utils/gamification';
import { showAchievementNotification, showLevelUpNotification } from '../src/components/AchievementNotification';
import type { 
  DebateResult, 
  LoadingState, 
  ModelConfig,
  DebateRequest,
  EoTStrategy
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
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('default');
  const [selectedModels, setSelectedModels] = useState<string[]>(['deepseek', 'qwen', 'hunyuan']);
  const [teacherSelection, setTeacherSelection] = useState<TeacherSelectionState>({});
  const [selectedEoTStrategy, setSelectedEoTStrategy] = useState<EoTStrategy>('debate');
  const [debateResult, setDebateResult] = useState<DebateResult | null>(null);
  const [partialResult, setPartialResult] = useState<DebateResult | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    currentStage: null,
    currentModel: null,
    progress: 0,
  });
  const [eotStrategy, setEoTStrategy] = useState<EoTStrategy | null>(null);
  
  // 处理游戏化事件
  const handleGamificationEvent = (event: GamificationEvent) => {
    // 只在客户端环境中处理游戏化事件
    if (typeof window === 'undefined') {
      return;
    }

    const result = GamificationManager.handleEvent(event);
    
    // 显示新成就通知
    result.newAchievements.forEach(achievement => {
      showAchievementNotification(achievement, result.pointsEarned);
    });

    // 显示等级提升通知
    if (result.levelUp) {
      const userStats = GamificationManager.getUserStats();
      const levelTitle = GamificationManager.getLevelTitle(userStats.level);
      showLevelUpNotification(userStats.level, levelTitle);
    }
  };
  
  // 从 localStorage 加载主题
  useEffect(() => {
    // 页面加载后检查是否存在保存的主题
    const savedTheme = typeof window !== 'undefined' 
      ? localStorage.getItem('debate-theme') 
      : null;
    
    if (savedTheme && ['default', 'theme-amber', 'theme-teal'].includes(savedTheme)) {
      setCurrentTheme(savedTheme);
    }
  }, []);
  
  // 切换主题
  const toggleTheme = () => {
    const themes = ['default', 'theme-amber', 'theme-teal'];
    const currentIndex = themes.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themes.length;
    const newTheme = themes[nextIndex];
    
    // 保存到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('debate-theme', newTheme);
    }
    
    setCurrentTheme(newTheme);
  };

  // 页面加载完成后的动画效果
  useEffect(() => {
    // 当页面完全加载后再显示动画效果
    const onLoad = () => {
      setIsPageLoaded(true);
    };
    
    // 如果页面已经加载完成
    if (document.readyState === 'complete') {
      onLoad();
    } else {
      window.addEventListener('load', onLoad);
      return () => window.removeEventListener('load', onLoad);
    }
  }, []);
  
  // 初始化游戏化系统
  useEffect(() => {
    // 只在客户端环境中初始化游戏化系统
    if (typeof window !== 'undefined') {
      // 延迟执行，确保页面完全加载
      const timer = setTimeout(() => {
        handleGamificationEvent({ type: 'daily_login' });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, []);
  
  // 滚动到结果区域
  const scrollToResults = useCallback(() => {
    if (debateResult || partialResult) {
      setTimeout(() => {
        const resultsElement = document.querySelector('.results-container');
        if (resultsElement) {
          resultsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500);
    }
  }, [debateResult, partialResult]);
  
  // 当结果更新时，滚动到结果区域
  useEffect(() => {
    scrollToResults();
  }, [debateResult, partialResult, scrollToResults]);

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
        const currentQuestion = question.trim();
        const newResult: DebateResult = prev || {
          question: currentQuestion,
          models: selectedModels,
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

    try {
      // 根据选择的策略决定使用哪个API
      if (selectedEoTStrategy === 'debate') {
        // 使用原有的辩论API
        const request: DebateRequest = {
          question: question.trim(),
          models: selectedModels,
          teacherPersonas: teacherSelection, // 添加教师人格化信息
        };

        const result = await startDebate(request, handleStageUpdate, handleStageComplete);
        setDebateResult(result);
        
        // 触发游戏化事件
        handleGamificationEvent({
          type: 'debate_completed',
          data: { 
            models: selectedModels,
            question: question.trim(),
            teacherPersonas: teacherSelection,
            strategy: 'debate'
          }
        });
        
        message.success('辩论完成！');
      } else {
        // 使用新的EoT流式传输API
        const eotRequest = {
          question: question.trim(),
          models: selectedModels,
          eotStrategy: selectedEoTStrategy,
          teacherPersonas: teacherSelection, // 添加教师人格化信息
        };

        const result = await startEoTReasoningWithStream(eotRequest, handleStageUpdate, handleStageComplete);
        setDebateResult(result);
        
        // 触发游戏化事件
        handleGamificationEvent({
          type: 'debate_completed',
          data: { 
            models: selectedModels,
            question: question.trim(),
            teacherPersonas: teacherSelection,
            strategy: selectedEoTStrategy
          }
        });
        
        // 处理策略使用事件
        handleGamificationEvent({
          type: 'strategy_use',
          data: { strategy: selectedEoTStrategy }
        });
        
        message.success(`${selectedEoTStrategy}策略推理完成！`);
      }

        // 处理教师交互事件
        Object.keys(teacherSelection).forEach(modelId => {
          const teacherId = teacherSelection[modelId];
          if (teacherId) {
            handleGamificationEvent({
              type: 'teacher_interaction',
              data: { teacherId }
            });
          }
        });
        
        // 设置最终状态
      setLoadingState({
        isLoading: false,
        currentStage: null,
        currentModel: null,
        progress: 100,
      });

    } catch (error) {
      console.error('Processing error:', error);
      
      setLoadingState({
        isLoading: false,
        currentStage: null,
        currentModel: null,
        progress: 0,
      });

      const errorMessage = error instanceof Error ? error.message : '推理过程中发生错误';
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

  // 处理EoT策略选择变化
  const handleEoTChange = (strategy: EoTStrategy) => {
    setEoTStrategy(strategy);
  };

  return (
    <>
      <Head>
        <title>多LLM辩论教育平台</title>
        <meta name="description" content="通过多个AI模型的辩论与审视，获得更全面、准确的答案" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </Head>

      <div className={`app-container ${currentTheme}`}>
        <motion.div 
          className="particles-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: isPageLoaded ? 0.8 : 0 }}
          transition={{ duration: 1.5 }}
        >
          <ParticleBackground 
            color={
              currentTheme === 'theme-amber' 
                ? 'rgba(255, 191, 0, 0.5)' 
                : currentTheme === 'theme-teal' 
                  ? 'rgba(0, 150, 136, 0.5)' 
                  : 'rgba(255, 255, 255, 0.5)'
            } 
          />
        </motion.div>
        
        {/* 辅助功能工具栏 */}
        <AccessibilityToolbar
          currentTheme={currentTheme}
          onThemeChange={(theme) => {
            setCurrentTheme(theme);
            if (typeof window !== 'undefined') {
              localStorage.setItem('debate-theme', theme);
            }
          }}
        />
        
        <Layout className="main-content">
          {/* 头部 */}
          <Header className="app-header">
            <AppHeader 
              toggleTheme={toggleTheme} 
              currentTheme={currentTheme}
              isPageLoaded={isPageLoaded}
            />
          </Header>

          {/* 主要内容 */}
          <Content className="app-content">
            {/* 介绍卡片 */}
            <motion.div 
              className="intro-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isPageLoaded ? 1 : 0, y: isPageLoaded ? 0 : 20 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%)',
                backdropFilter: 'blur(10px)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '30px',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                <motion.div
                  style={{ 
                    background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))',
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '24px'
                  }}
                  animate={{ 
                    rotate: [0, 10, 0, -10, 0],
                  }}
                  transition={{ 
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <BulbOutlined />
                </motion.div>
                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
                  AI辩论如何使用
                </h2>
              </div>
              <p style={{ 
                color: 'var(--text-secondary)',
                fontSize: '1rem',
                lineHeight: '1.6',
                margin: '0 0 15px 0'
              }}>
                通过让多个AI模型针对同一问题展开辩论，从不同视角分析问题，帮助您获得更全面、更深入的见解。
              </p>
              
              <div style={{ 
                display: 'flex',
                gap: '15px',
                flexWrap: 'wrap'
              }}>
                <div style={{ 
                  flex: '1 1 200px',
                  background: 'rgba(255,255,255,0.5)',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <div style={{ 
                    background: 'rgba(71, 118, 230, 0.1)',
                    color: 'var(--primary-color)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>1</div>
                  <div>
                    <strong>提出复杂问题</strong>
                    <p style={{ 
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      margin: '5px 0 0 0'
                    }}>输入您想探讨的问题，比如伦理、科技、教育等话题</p>
                  </div>
                </div>
                
                <div style={{ 
                  flex: '1 1 200px',
                  background: 'rgba(255,255,255,0.5)',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <div style={{ 
                    background: 'rgba(71, 118, 230, 0.1)',
                    color: 'var(--primary-color)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>2</div>
                  <div>
                    <strong>选择至少两个AI模型</strong>
                    <p style={{ 
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      margin: '5px 0 0 0'
                    }}>不同AI模型有各自的特点，多样性带来更丰富的观点</p>
                  </div>
                </div>
                
                <div style={{ 
                  flex: '1 1 200px',
                  background: 'rgba(255,255,255,0.5)',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px'
                }}>
                  <div style={{ 
                    background: 'rgba(71, 118, 230, 0.1)',
                    color: 'var(--primary-color)',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>3</div>
                  <div>
                    <strong>获取综合分析</strong>
                    <p style={{ 
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      margin: '5px 0 0 0'
                    }}>系统将自动组织辩论，生成多角度分析和最终总结</p>
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* 问题输入区域 */}
            <motion.div 
              className="question-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isPageLoaded ? 1 : 0, y: isPageLoaded ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 1.0 }}
            >
              <h2>
                <span><QuestionCircleOutlined /></span>
                提出您的问题
              </h2>
              <QuestionInput
                onSubmit={handleQuestionSubmit}
                isLoading={loadingState.isLoading}
                placeholder="请输入您想要探讨的问题，例如：人工智能对教育的影响是什么？"
              />
            </motion.div>

            {/* 模型选择区域 */}
            <motion.div 
              className="model-selector-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isPageLoaded ? 1 : 0, y: isPageLoaded ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 1.2 }}
            >
              <h3>
                <span><ApiOutlined /></span>
                选择参与辩论的AI模型
              </h3>
              <p className="model-info-text">
                至少选择2个模型进行辩论，让不同AI视角帮助分析问题，获取更客观的结论
              </p>
              <ModelSelector
                models={DEFAULT_MODELS}
                selectedModels={selectedModels}
                onModelChange={handleModelChange}
                disabled={loadingState.isLoading}
              />
            </motion.div>

            {/* 教师选择区域 */}
            <motion.div 
              className="teacher-selector-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isPageLoaded ? 1 : 0, y: isPageLoaded ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <TeacherSelector 
                models={DEFAULT_MODELS}
                selectedModels={selectedModels}
                onTeacherSelectionChange={handleTeacherSelectionChange}
                disabled={loadingState.isLoading}
              />
            </motion.div>

            {/* EoT策略选择区域 */}
            <motion.div 
              className="eot-selector-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: isPageLoaded ? 1 : 0, y: isPageLoaded ? 0 : 30 }}
              transition={{ duration: 0.6, delay: 1.4 }}
            >
              <h3>
                <span><RobotOutlined /></span>
                选择EoT策略
              </h3>
              <p className="eot-info-text">
                选择一种EoT策略，帮助AI更好地理解问题的上下文和细节
              </p>
              <EoTSelector
                selectedStrategy={selectedEoTStrategy}
                onStrategyChange={setSelectedEoTStrategy}
                disabled={loadingState.isLoading}
              />
            </motion.div>

            {/* 加载指示器 */}
            {loadingState.isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <LoadingIndicator loadingState={loadingState} />
              </motion.div>
            )}

            {/* 结果展示 */}
            {(debateResult || partialResult) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
              >
                <ResultDisplay
                  result={debateResult || partialResult}
                  isLoading={loadingState.isLoading}
                />
              </motion.div>
            )}
          </Content>
        </Layout>
        
        {/* 游戏化面板 */}
        <GamificationPanel />
      </div>
    </>
  );
}

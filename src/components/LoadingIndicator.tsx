import React, { useEffect, useState } from 'react';
import { 
  LoadingOutlined, 
  RobotOutlined, 
  CheckCircleOutlined,
  SyncOutlined,
  SafetyOutlined,
  ThunderboltOutlined,
  ExperimentOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { LoadingState } from '../types';

interface LoadingIndicatorProps {
  loadingState: LoadingState;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ loadingState }) => {
  const { currentStage, progress, currentModel } = loadingState;
  const [loadingTextIndex, setLoadingTextIndex] = useState<number>(0);

  // 阶段信息配置
  const stageInfo = {
    initial: {
      title: '阶段一：初始提案',
      description: '各个AI模型正在独立思考并提供初始回答...',
      icon: <RobotOutlined />,
      color: 'var(--primary-color)',
      emoji: '🎯'
    },
    refined: {
      title: '阶段二：交叉审视',
      description: '模型们正在互相审视答案并进行修正优化...',
      icon: <SyncOutlined spin />,
      color: 'var(--secondary-color)',
      emoji: '🔄'
    },
    final: {
      title: '阶段三：最终验证',
      description: '验证者模型正在综合所有观点并提供最终答案...',
      icon: <SafetyOutlined />,
      color: 'var(--tertiary-color)',
      emoji: '✅'
    },
  };

  // 加载状态文本
  const loadingTexts = [
    '🤔 AI模型们正在深度思考...',
    '💭 分析问题的各个角度...',
    '🔍 搜索相关知识和经验...',
    '⚡ 生成详细回答中...',
    '🎯 优化答案质量...',
  ];

  // 定时切换加载文本
  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const currentStageInfo = currentStage ? stageInfo[currentStage] : null;

  return (
    <div className="loading-container">
      <div className="loading-title">
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [1, 0.9, 1] 
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
        >
          <LoadingOutlined style={{ fontSize: '1.5rem' }} />
          多AI辩论进行中...
        </motion.div>
      </div>

      {currentStageInfo && (
        <motion.div
          className="loading-stage"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h4>
            <span>{currentStageInfo.icon}</span>
            {currentStageInfo.emoji} {currentStageInfo.title}
          </h4>
          <p>{currentStageInfo.description}</p>

          <div className="loading-progress">
            <motion.div 
              className="loading-progress-bar"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          {currentModel && (
            <div className="loading-model">
              <ExperimentOutlined style={{ marginRight: '8px' }} />
              当前模型: {currentModel}
            </div>
          )}
        </motion.div>
      )}

      {/* 动态加载文本 */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={loadingTextIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.5 }}
          style={{ 
            textAlign: 'center', 
            margin: '20px 0',
            fontSize: '1rem',
            color: 'var(--text-secondary)'
          }}
        >
          {loadingTexts[loadingTextIndex]}
        </motion.div>
      </AnimatePresence>

      {/* 阶段指示器 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '25px', marginTop: '20px' }}>
        {Object.entries(stageInfo).map(([stage, info], index) => {
          const isActive = currentStage === stage;
          const isCompleted = currentStage ? 
            Object.keys(stageInfo).indexOf(currentStage) > index : false;
          
          return (
            <div
              key={stage}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <motion.div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: isCompleted 
                    ? 'var(--tertiary-color)' 
                    : isActive 
                      ? info.color 
                      : 'var(--bg-tertiary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isCompleted || isActive ? 'white' : 'var(--text-light)',
                  fontSize: isActive ? '1.2rem' : '1rem',
                  opacity: isActive || isCompleted ? 1 : 0.6,
                }}
                animate={isActive ? { 
                  scale: [1, 1.1, 1],
                  boxShadow: [
                    '0px 0px 0px rgba(0,0,0,0)', 
                    '0px 0px 15px rgba(71,118,230,0.4)', 
                    '0px 0px 0px rgba(0,0,0,0)'
                  ]
                } : { scale: 1 }}
                transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: "easeInOut" }}
              >
                {isCompleted ? (
                  <CheckCircleOutlined />
                ) : isActive ? (
                  <ThunderboltOutlined />
                ) : (
                  index + 1
                )}
              </motion.div>
              <span 
                style={{ 
                  fontSize: '0.85rem', 
                  textAlign: 'center',
                  color: isActive ? info.color : isCompleted ? 'var(--text-secondary)' : 'var(--text-light)',
                  fontWeight: isActive ? 600 : isCompleted ? 500 : 400,
                  opacity: isActive || isCompleted ? 1 : 0.8,
                }}
              >
                阶段 {index + 1}
              </span>
            </div>
          );
        })}
      </div>

      {/* 预估时间 */}
      <div style={{ 
        marginTop: '30px',
        fontSize: '0.9rem',
        color: 'var(--text-light)',
        textAlign: 'center'
      }}>
        ⏱️ 预计还需要 {Math.max(1, Math.ceil((100 - progress) / 10))} 秒完成
      </div>

      <motion.div 
        className="loading-spinner" 
        animate={{ rotate: 360 }}
        transition={{ ease: "linear", duration: 2, repeat: Infinity }}
      />
    </div>
  );
};

export default LoadingIndicator;

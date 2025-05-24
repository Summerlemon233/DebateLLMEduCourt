import React from 'react';
import { Card, Progress, Typography, Space, Spin } from 'antd';
import { 
  LoadingOutlined, 
  RobotOutlined, 
  CheckCircleOutlined,
  SyncOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { LoadingIndicatorProps } from '@/types';

const { Title, Text } = Typography;

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ loadingState }) => {
  const { currentStage, progress, currentModel } = loadingState;

  // 获取模型显示名称
  const getModelName = (modelId: string | null) => {
    if (!modelId) return null;
    const modelNames: { [key: string]: string } = {
      'deepseek': 'DeepSeek',
      'qwen': 'Qwen (通义千问)',
      'doubao': 'Doubao (豆包)',
      'chatglm': 'ChatGLM',
      'hunyuan': 'Tencent Hunyuan'
    };
    return modelNames[modelId] || modelId;
  };

  // 阶段信息配置
  const stageInfo = {
    initial: {
      title: '🎯 阶段一：初始提案',
      description: '各个AI模型正在独立思考并提供初始回答...',
      icon: <RobotOutlined style={{ color: '#4facfe' }} />,
      color: '#4facfe',
    },
    refined: {
      title: '🔄 阶段二：交叉审视',
      description: '模型们正在互相审视答案并进行修正优化...',
      icon: <SyncOutlined spin style={{ color: '#faad14' }} />,
      color: '#faad14',
    },
    final: {
      title: '✅ 阶段三：最终验证',
      description: '验证者模型正在综合所有观点并提供最终答案...',
      icon: <SafetyOutlined style={{ color: '#52c41a' }} />,
      color: '#52c41a',
    },
  };

  const currentStageInfo = currentStage ? stageInfo[currentStage] : null;

  // 加载状态文本
  const getLoadingText = () => {
    const texts = [
      '🤔 AI模型们正在深度思考...',
      '💭 分析问题的各个角度...',
      '🔍 搜索相关知识和经验...',
      '⚡ 生成详细回答中...',
      '🎯 优化答案质量...',
    ];
    
    const index = Math.floor(Date.now() / 2000) % texts.length;
    return texts[index];
  };

  return (
    <div className="loading-container fade-in">
      <Card 
        style={{ 
          maxWidth: '600px', 
          margin: '0 auto',
          border: '2px solid #e1e5e9',
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {/* 主标题 */}
          <Title level={3} style={{ marginBottom: '8px', color: '#333' }}>
            <Spin 
              indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}
              style={{ marginRight: '12px' }}
            />
            多AI辩论进行中...
          </Title>

          {/* 当前阶段信息 */}
          {currentStageInfo && (
            <div style={{ marginBottom: '24px' }}>
              <div 
                style={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  background: `${currentStageInfo.color}15`,
                  borderRadius: '20px',
                  border: `1px solid ${currentStageInfo.color}30`,
                  marginBottom: '12px'
                }}
              >
                {currentStageInfo.icon}
                <Text strong style={{ color: currentStageInfo.color }}>
                  {currentStageInfo.title}
                </Text>
              </div>
              <Text style={{ display: 'block', color: '#666', fontSize: '14px' }}>
                {currentStageInfo.description}
              </Text>
              {/* 显示当前处理的模型 */}
              {currentModel && (
                <div style={{ marginTop: '8px' }}>
                  <Text style={{ fontSize: '13px', color: '#4facfe' }}>
                    🤖 当前处理：<Text strong>{getModelName(currentModel)}</Text>
                  </Text>
                </div>
              )}
            </div>
          )}

          {/* 进度条 */}
          <div style={{ marginBottom: '20px' }}>
            <Progress
              percent={Math.round(progress)}
              strokeColor={{
                '0%': '#4facfe',
                '100%': '#00f2fe',
              }}
              trailColor="#f0f0f0"
              strokeWidth={8}
              style={{ marginBottom: '8px' }}
            />
            <Text style={{ fontSize: '13px', color: '#999' }}>
              {Math.round(progress)}% 完成
            </Text>
          </div>

          {/* 动态加载文本 */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            <Text style={{ fontSize: '14px', color: '#666' }} className="pulse">
              {getLoadingText()}
            </Text>
          </div>

          {/* 阶段指示器 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
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
                    gap: '4px',
                    opacity: isActive || isCompleted ? 1 : 0.4,
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCompleted ? '#52c41a' : isActive ? info.color : '#e1e5e9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircleOutlined />
                    ) : isActive ? (
                      <LoadingOutlined spin />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <Text 
                    style={{ 
                      fontSize: '11px', 
                      textAlign: 'center',
                      color: isActive || isCompleted ? '#333' : '#999',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    阶段{index + 1}
                  </Text>
                </div>
              );
            })}
          </div>

          {/* 预估时间 */}
          <div style={{ marginTop: '16px' }}>
            <Text style={{ fontSize: '12px', color: '#999' }}>
              ⏱️ 预计还需要 {Math.max(0, Math.ceil((100 - progress) / 10))} 秒完成
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingIndicator;

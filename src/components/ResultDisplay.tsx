import React from 'react';
import { Card, Typography, Timeline, Badge, Empty, Divider, Tag } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { 
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  BulbOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import type { ResultDisplayProps, DebateStage, LLMResponse, RealtimeDebateResult, DebateResult } from '@/types';

const { Title, Text, Paragraph } = Typography;

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading }) => {
  // 添加调试日志
  console.log('🖼️ ResultDisplay 重新渲染:', {
    hasResult: !!result,
    isLoading,
    stages: result?.stages?.length || 0,
    currentStage: 'currentStage' in (result || {}) ? (result as RealtimeDebateResult).currentStage : 'N/A',
    isComplete: 'isComplete' in (result || {}) ? (result as RealtimeDebateResult).isComplete : 'N/A',
    totalResponses: result?.stages?.reduce((sum, stage) => sum + stage.responses.length, 0) || 0,
    stagesWithResponses: result?.stages?.map(s => ({ stage: s.stage, responses: s.responses.length })) || []
  });

  // 如果正在加载或没有结果，显示空状态
  if (isLoading || !result) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        {!isLoading && (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="提交问题后，AI辩论结果将在这里显示"
            style={{ color: '#999' }}
          />
        )}
      </div>
    );
  }

  // 判断是否为实时辩论结果
  const isRealtimeResult = 'isComplete' in result;
  const realtimeResult = result as RealtimeDebateResult;
  const staticResult = result as DebateResult;

  // 获取模型显示名称
  const getModelName = (modelId: string) => {
    const modelNames: { [key: string]: string } = {
      'deepseek-chat': 'DeepSeek Chat',
      'qwen-max': 'Qwen Max',
      'doubao-pro': 'Doubao Pro',
      'chatglm-4': 'ChatGLM-4',
      'hunyuan-pro': 'Tencent Hunyuan Pro'
    };
    return modelNames[modelId] || modelId;
  };

  // 格式化时间戳 - 现在是字符串格式
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取模型响应的状态标签 - 基于内容判断成功/失败
  const getResponseStatusBadge = (response: LLMResponse) => {
    const hasContent = response.content && response.content.trim().length > 0;
    if (hasContent) {
      return <Badge status="success" text="成功" />;
    } else {
      return <Badge status="error" text="失败" />;
    }
  };

  // 渲染单个模型响应，包括加载状态
  const renderModelResponse = (response: LLMResponse, index: number, isLoading?: boolean) => {
    const hasContent = response.content && response.content.trim().length > 0;
    console.log(`🤖 渲染模型响应: ${response.model}, 有内容: ${hasContent}, 内容长度: ${response.content?.length || 0}, 加载中: ${isLoading}`);
    
    return (
      <Card
        key={`${response.model}-${index}`}
        size="small"
        style={{
          marginBottom: '16px',
          border: isLoading ? '1px solid #faad14' : hasContent ? '1px solid #e1e5e9' : '1px solid #ffccc7',
          background: isLoading ? '#fffbe6' : hasContent ? 'white' : '#fff2f0',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RobotOutlined style={{ color: isLoading ? '#faad14' : '#4facfe' }} />
              <Text strong style={{ fontSize: '16px' }}>
                {getModelName(response.model)}
              </Text>
              {isLoading ? (
                <Badge status="processing" text="生成中..." />
              ) : (
                getResponseStatusBadge(response)
              )}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {isLoading ? '...' : formatTimestamp(response.timestamp)}
            </Text>
          </div>
        </div>

        {isLoading ? (
          <div style={{
            background: '#fffbe6',
            padding: '16px',
            borderRadius: '8px',
            textAlign: 'center',
            border: '1px solid #faad14'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <Text type="secondary">AI正在思考和生成回复...</Text>
            </div>
          </div>
        ) : hasContent ? (
          <div
            style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: 0,
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({node, inline, className, children, ...props}: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={tomorrow as any}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                p: ({children}) => <div style={{ marginBottom: '12px', lineHeight: '1.7' }}>{children}</div>,
                h1: ({children}) => <h3 style={{ color: '#1890ff', marginTop: '16px', marginBottom: '8px' }}>{children}</h3>,
                h2: ({children}) => <h4 style={{ color: '#1890ff', marginTop: '12px', marginBottom: '6px' }}>{children}</h4>,
                h3: ({children}) => <h5 style={{ color: '#1890ff', marginTop: '8px', marginBottom: '4px' }}>{children}</h5>,
                ul: ({children}) => <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>{children}</ul>,
                ol: ({children}) => <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>{children}</ol>,
                li: ({children}) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                blockquote: ({children}) => (
                  <blockquote style={{
                    borderLeft: '4px solid #1890ff',
                    paddingLeft: '16px',
                    margin: '16px 0',
                    fontStyle: 'italic',
                    background: '#f0f9ff',
                    padding: '12px 16px',
                    borderRadius: '4px'
                  }}>
                    {children}
                  </blockquote>
                ),
              }}
            >
              {response.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div style={{
            background: '#fff2f0',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ffccc7',
          }}>
            <Text type="danger">
              <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
              错误: 模型响应失败或内容为空
            </Text>
          </div>
        )}
      </Card>
    );
  };

  // 渲染阶段，包括正在进行的模型
  const renderDebateStageWithLoading = (
    stage: DebateStage,
    stageNumber: number,
    title: string,
    description: string,
    icon: React.ReactNode,
    color: string,
    isCurrentStage?: boolean,
    expectedModels?: string[]
  ) => {
    const completedModels = stage.responses.map(r => r.model);
    const pendingModels = expectedModels ? expectedModels.filter(m => !completedModels.includes(m)) : [];

    return (
      <div 
        key={`stage-${stageNumber}`}
        data-stage={stageNumber}
        style={{ marginBottom: '32px' }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          marginBottom: '16px',
          padding: '12px 16px',
          background: `${color}15`,
          borderRadius: '8px',
          border: `1px solid ${color}30`
        }}>
          {icon}
          <Title level={3} style={{ margin: 0, color }}>
            {title}
          </Title>
          {isCurrentStage && (
            <Badge status="processing" text="进行中" style={{ marginLeft: '8px' }} />
          )}
          <Tag color={color} style={{ marginLeft: 'auto' }}>
            {formatTimestamp(stage.startTime)}
          </Tag>
        </div>
        
        <Text style={{ 
          display: 'block', 
          marginBottom: '16px', 
          color: '#666',
          fontSize: '14px'
        }}>
          {description}
        </Text>

        <div>
          {/* 渲染已完成的响应 */}
          {stage.responses.map((response, index) => 
            renderModelResponse(response, index)
          )}
          
          {/* 渲染正在等待的模型 */}
          {isCurrentStage && pendingModels.map((model, index) => 
            renderModelResponse({
              model,
              content: '',
              timestamp: '',
              responseTime: 0
            }, completedModels.length + index, true)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="results-container fade-in">
      <Title level={2} style={{ textAlign: 'center', marginBottom: '24px', color: '#333' }}>
        <BulbOutlined style={{ marginRight: '8px', color: '#4facfe' }} />
        AI辩论结果
      </Title>

      {/* 问题展示 */}
      <Card style={{ marginBottom: '24px', background: '#f0f9ff', border: '1px solid #b3d9ff' }}>
        <Title level={4} style={{ marginBottom: '8px', color: '#1890ff' }}>
          🤔 讨论问题
        </Title>
        <Text style={{ fontSize: '16px', lineHeight: '1.6' }}>
          {result.question}
        </Text>
      </Card>

      {/* 辩论统计信息 */}
      <Card style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center' }}>
          <div>
            <Title level={4} style={{ margin: 0, color: '#4facfe' }}>
              {result.stages.length > 0 ? result.stages[0].responses.length : 0}
            </Title>
            <Text type="secondary">参与模型</Text>
          </div>
          <Divider type="vertical" style={{ height: '40px' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
              {Math.round(result.duration / 1000)}s
            </Title>
            <Text type="secondary">辩论耗时</Text>
          </div>
          <Divider type="vertical" style={{ height: '40px' }} />
          <div>
            <Title level={4} style={{ margin: 0, color: '#faad14' }}>
              {result.stages.length}
            </Title>
            <Text type="secondary">辩论阶段</Text>
          </div>
          {isRealtimeResult && (
            <>
              <Divider type="vertical" style={{ height: '40px' }} />
              <div>
                <Title level={4} style={{ margin: 0, color: realtimeResult.isComplete ? '#52c41a' : '#faad14' }}>
                  {realtimeResult.isComplete ? '已完成' : '进行中'}
                </Title>
                <Text type="secondary">状态</Text>
              </div>
            </>
          )}
        </div>
      </Card>

      {/* 时间轴展示辩论过程 */}
      <Timeline
        mode="left"
        style={{ marginBottom: '32px' }}
        items={[
          {
            color: '#4facfe',
            dot: <ClockCircleOutlined style={{ fontSize: '16px' }} />,
            children: (
              <div>
                <Text strong>开始辩论</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {result.stages.length > 0 ? formatTimestamp(result.stages[0].startTime) : ''}
                </Text>
              </div>
            ),
          },
          ...(isRealtimeResult && realtimeResult.isComplete || !isRealtimeResult ? [{
            color: '#52c41a',
            dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
            children: (
              <div>
                <Text strong>辩论完成</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {result.stages.length > 0 ? formatTimestamp(result.stages[result.stages.length - 1].endTime) : ''}
                </Text>
              </div>
            ),
          }] : []),
        ]}
      />

      {/* 渲染所有辩论阶段 */}
      {result.stages.map((stage, index) => {
        const stageConfigs = [
          {
            title: '🎯 阶段一：初始提案',
            description: '各个AI模型基于问题独立提供初始回答',
            icon: <RobotOutlined style={{ fontSize: '20px', color: '#4facfe' }} />,
            color: '#4facfe'
          },
          {
            title: '🔄 阶段二：交叉审视与修正',
            description: '模型们互相审视其他模型的回答，并对自己的答案进行修正和优化',
            icon: <RobotOutlined style={{ fontSize: '20px', color: '#faad14' }} />,
            color: '#faad14'
          },
          {
            title: '✅ 阶段三：最终验证与综合',
            description: '综合所有观点，提供最终的准确答案',
            icon: <SafetyOutlined style={{ fontSize: '20px', color: '#52c41a' }} />,
            color: '#52c41a'
          }
        ];

        const config = stageConfigs[index] || stageConfigs[stageConfigs.length - 1];
        
        // 修复当前阶段的判断逻辑
        const isCurrentStage = isRealtimeResult && !realtimeResult.isComplete && 
                               realtimeResult.currentStage === stage.stage;
        
        // 如果阶段已经完成，显示所有响应
        // 如果是当前阶段且未完成，可能需要显示部分响应
        const shouldShowStage = stage.responses.length > 0 || isCurrentStage;
        
        console.log(`🎭 渲染阶段 ${stage.stage}:`, {
          stageNumber: stage.stage,
          responsesCount: stage.responses.length,
          isCurrentStage,
          shouldShowStage,
          currentStageFromResult: isRealtimeResult ? realtimeResult.currentStage : 'N/A',
          isComplete: isRealtimeResult ? realtimeResult.isComplete : 'N/A'
        });
        
        // 只显示有响应或当前进行中的阶段
        if (!shouldShowStage) {
          return null;
        }
        
        return renderDebateStageWithLoading(
          stage,
          index + 1,
          config.title,
          config.description,
          config.icon,
          config.color,
          isCurrentStage,
          result.models
        );
      })}

      {/* 底部总结 - 只在辩论完成时显示 */}
      {(isRealtimeResult ? realtimeResult.isComplete : true) && (
        <>
          {/* 显示总结内容 */}
          {(isRealtimeResult ? realtimeResult.summary : staticResult.summary) && (
            <Card 
              style={{ 
                background: 'linear-gradient(135deg, #fff2e6 0%, #fef7e6 100%)',
                border: '1px solid #ffcb8a',
                marginBottom: '24px'
              }}
            >
              <Title level={4} style={{ color: '#fa8c16', marginBottom: '16px' }}>
                📝 辩论总结
              </Title>
              <div style={{
                background: '#fff',
                padding: '16px',
                borderRadius: '8px',
                border: '1px solid #f0f0f0'
              }}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({node, inline, className, children, ...props}: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={tomorrow as any}
                          language={match[1]}
                          PreTag="div"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    p: ({children}) => <div style={{ marginBottom: '12px', lineHeight: '1.7' }}>{children}</div>,
                    h1: ({children}) => <h3 style={{ color: '#1890ff', marginTop: '16px', marginBottom: '8px' }}>{children}</h3>,
                    h2: ({children}) => <h4 style={{ color: '#1890ff', marginTop: '12px', marginBottom: '6px' }}>{children}</h4>,
                    h3: ({children}) => <h5 style={{ color: '#1890ff', marginTop: '8px', marginBottom: '4px' }}>{children}</h5>,
                    ul: ({children}) => <ul style={{ paddingLeft: '20px', marginBottom: '12px' }}>{children}</ul>,
                    ol: ({children}) => <ol style={{ paddingLeft: '20px', marginBottom: '12px' }}>{children}</ol>,
                    li: ({children}) => <li style={{ marginBottom: '4px' }}>{children}</li>,
                  }}
                >
                  {isRealtimeResult ? realtimeResult.summary! : staticResult.summary}
                </ReactMarkdown>
              </div>
            </Card>
          )}
          
          {/* 辩论统计总结 */}
          <Card 
            style={{ 
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
              border: '1px solid #b3d9ff',
              textAlign: 'center'
            }}
          >
            <Title level={4} style={{ color: '#1890ff', marginBottom: '8px' }}>
              🎉 辩论总结
            </Title>
            <Text>
              本次辩论共有 <Text strong>{result.stages.length > 0 ? result.stages[0].responses.length : 0} 个AI模型</Text> 参与，
              历时 <Text strong>{Math.round(result.duration / 1000)} 秒</Text>，
              通过 <Text strong>{result.stages.length}个阶段</Text> 的深度讨论和验证，
              为您提供了经过充分思辨的答案。
            </Text>
          </Card>
        </>
      )}
    </div>
  );
};

export default ResultDisplay;

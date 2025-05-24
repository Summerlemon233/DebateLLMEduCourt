import React from 'react';
import { Card, Typography, Timeline, Badge, Empty, Divider, Tag, Space } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { 
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  BulbOutlined,
  ExclamationCircleOutlined,
  CrownOutlined,
  StarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import type { ResultDisplayProps, DebateStage, LLMResponse } from '@/types';

const { Title, Text, Paragraph } = Typography;

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading }) => {
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

  // 获取模型显示名称和图标
  const getModelInfo = (modelId: string) => {
    const modelInfoMap: { [key: string]: { name: string; icon: React.ReactNode; color: string; tier: string } } = {
      'deepseek': { name: 'DeepSeek Chat', icon: <RobotOutlined />, color: '#4facfe', tier: 'Pro' },
      'qwen': { name: 'Qwen (通义千问)', icon: <StarOutlined />, color: '#ff7a45', tier: 'Max' },
      'doubao': { name: 'Doubao (豆包)', icon: <BulbOutlined />, color: '#722ed1', tier: 'Pro' },
      'chatglm': { name: 'ChatGLM', icon: <TrophyOutlined />, color: '#13c2c2', tier: 'Elite' },
      'hunyuan': { name: 'Tencent Hunyuan', icon: <CrownOutlined />, color: '#52c41a', tier: 'Premium' }
    };
    return modelInfoMap[modelId] || { 
      name: modelId, 
      icon: <RobotOutlined />, 
      color: '#666666', 
      tier: 'Standard' 
    };
  };

  // 自定义Markdown组件
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: '8px',
            fontSize: '14px',
            margin: '16px 0',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code 
          className={className} 
          style={{
            background: '#f6f8fa',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.9em',
            color: '#e83e8c'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => (
      <Typography.Title level={2} style={{ color: '#1890ff', marginTop: '24px' }}>
        {children}
      </Typography.Title>
    ),
    h2: ({ children }: any) => (
      <Typography.Title level={3} style={{ color: '#722ed1', marginTop: '20px' }}>
        {children}
      </Typography.Title>
    ),
    h3: ({ children }: any) => (
      <Typography.Title level={4} style={{ color: '#13c2c2', marginTop: '16px' }}>
        {children}
      </Typography.Title>
    ),
    p: ({ children }: any) => (
      <Typography.Paragraph style={{ marginBottom: '12px', lineHeight: '1.8' }}>
        {children}
      </Typography.Paragraph>
    ),
    blockquote: ({ children }: any) => (
      <div style={{
        borderLeft: '4px solid #1890ff',
        paddingLeft: '16px',
        margin: '16px 0',
        background: '#f6f8fa',
        padding: '12px 16px',
        borderRadius: '0 8px 8px 0',
        fontStyle: 'italic'
      }}>
        {children}
      </div>
    ),
    ul: ({ children }: any) => (
      <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
        {children}
      </ul>
    ),
    li: ({ children }: any) => (
      <li style={{ marginBottom: '8px', lineHeight: '1.6' }}>
        {children}
      </li>
    ),
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

  // 渲染单个模型响应
  const renderModelResponse = (response: LLMResponse, index: number) => {
    const hasContent = response.content && response.content.trim().length > 0;
    const modelInfo = getModelInfo(response.model);
    
    return (
      <Card
        key={`${response.model}-${index}`}
        size="small"
        style={{
          marginBottom: '20px',
          border: hasContent ? `2px solid ${modelInfo.color}20` : '2px solid #ffccc7',
          background: hasContent ? 'white' : '#fff2f0',
          borderRadius: '12px',
          boxShadow: hasContent 
            ? `0 8px 24px ${modelInfo.color}15, 0 0 0 1px ${modelInfo.color}10` 
            : '0 4px 12px rgba(255, 77, 79, 0.15)',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
        className="model-response-card"
      >
        <div style={{ marginBottom: '16px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: `linear-gradient(135deg, ${modelInfo.color}, ${modelInfo.color}80)`,
                padding: '8px',
                borderRadius: '8px',
                color: 'white',
                fontSize: '16px'
              }}>
                {modelInfo.icon}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Text strong style={{ fontSize: '16px', color: '#333' }}>
                    {modelInfo.name}
                  </Text>
                  <Tag 
                    color={modelInfo.color} 
                    style={{ 
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    {modelInfo.tier}
                  </Tag>
                </div>
                <div style={{ marginTop: '2px' }}>
                  {getResponseStatusBadge(response)}
                </div>
              </div>
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {formatTimestamp(response.timestamp)}
            </Text>
          </div>
        </div>

        {hasContent ? (
          <div
            style={{
              background: 'linear-gradient(135deg, #fafbfc, #f8f9fa)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: 0,
              border: '1px solid #e1e5e9',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '3px',
              background: `linear-gradient(90deg, ${modelInfo.color}, ${modelInfo.color}60)`
            }} />
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {response.content}
            </ReactMarkdown>
          </div>
        ) : (
          <div style={{
            background: 'linear-gradient(135deg, #fff2f0, #ffebe8)',
            padding: '20px',
            borderRadius: '12px',
            border: '2px solid #ffccc7',
            textAlign: 'center'
          }}>
            <Text type="danger" style={{ fontSize: '14px' }}>
              <ExclamationCircleOutlined style={{ marginRight: '8px', fontSize: '16px' }} />
              模型响应失败或内容为空
            </Text>
          </div>
        )}
      </Card>
    );
  };

  // 渲染辩论阶段
  const renderDebateStage = (
    stage: DebateStage,
    stageNumber: number,
    title: string,
    description: string,
    icon: React.ReactNode,
    color: string
  ) => {
    return (
      <div style={{ marginBottom: '40px' }}>
        <div style={{ 
          background: `linear-gradient(135deg, ${color}15, ${color}05)`,
          padding: '24px',
          borderRadius: '16px',
          border: `2px solid ${color}20`,
          marginBottom: '24px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* 装饰性背景元素 */}
          <div style={{
            position: 'absolute',
            top: '-20px',
            right: '-20px',
            width: '80px',
            height: '80px',
            background: `${color}10`,
            borderRadius: '50%',
            opacity: 0.5
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '100px',
            height: '100px',
            background: `${color}08`,
            borderRadius: '50%',
            opacity: 0.3
          }} />
          
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            position: 'relative',
            zIndex: 1
          }}>
            <div style={{
              background: `linear-gradient(135deg, ${color}, ${color}80)`,
              padding: '16px',
              borderRadius: '16px',
              color: 'white',
              fontSize: '24px',
              boxShadow: `0 8px 24px ${color}30`
            }}>
              {icon}
            </div>
            <div style={{ flex: 1 }}>
              <Title level={2} style={{ margin: 0, color, fontSize: '24px' }}>
                {title}
              </Title>
              <Text style={{ 
                display: 'block', 
                color: '#666', 
                fontSize: '16px',
                marginTop: '8px',
                lineHeight: '1.6'
              }}>
                {description}
              </Text>
            </div>
            <Space>
              <Tag 
                color={color} 
                style={{ 
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: 600
                }}
              >
                阶段 {stageNumber}
              </Tag>
              <Tag 
                style={{ 
                  padding: '8px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  background: '#f0f0f0',
                  border: 'none'
                }}
              >
                {formatTimestamp(stage.startTime)}
              </Tag>
            </Space>
          </div>
        </div>

        {/* 模型响应列表 */}
        <div style={{ 
          display: 'grid',
          gap: '20px',
          gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))'
        }}>
          {stage.responses.map((response, index) => 
            renderModelResponse(response, index)
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="results-container fade-in" style={{ padding: '20px 0' }}>
      {/* 头部标题 */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <Title level={1} style={{ 
          background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: '36px',
          fontWeight: 'bold',
          marginBottom: '8px'
        }}>
          <BulbOutlined style={{ marginRight: '12px', color: '#4facfe' }} />
          AI辩论结果
        </Title>
        <Text style={{ fontSize: '16px', color: '#666' }}>
          通过多AI模型的深度讨论，为您提供全面的答案视角
        </Text>
      </div>

      {/* 问题展示卡片 */}
      <Card style={{ 
        marginBottom: '32px', 
        background: 'linear-gradient(135deg, #f0f9ff, #e6f7ff)',
        border: '2px solid #91d5ff',
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(24, 144, 255, 0.15)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1890ff, #096dd9)',
            padding: '12px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '20px'
          }}>
            🤔
          </div>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            讨论问题
          </Title>
        </div>
        <Text style={{ 
          fontSize: '18px', 
          lineHeight: '1.8',
          color: '#333',
          fontWeight: 500
        }}>
          {result.question}
        </Text>
      </Card>

      {/* 辩论统计信息 */}
      <Card style={{ 
        marginBottom: '40px',
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          textAlign: 'center',
          padding: '16px 0'
        }}>
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {result.stages.length > 0 ? result.stages[0].responses.length : 0}
            </div>
            <Text style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>参与模型</Text>
          </div>
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #52c41a, #389e0d)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}>
              {Math.round(result.duration / 1000)}s
            </div>
            <Text style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>辩论耗时</Text>
          </div>
          <div>
            <div style={{
              background: 'linear-gradient(135deg, #faad14, #d48806)',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold'
            }}>
              {result.stages.length}
            </div>
            <Text style={{ fontSize: '14px', color: '#666', fontWeight: 500 }}>辩论阶段</Text>
          </div>
        </div>
      </Card>

      {/* 渲染所有辩论阶段 */}
      <div style={{ marginBottom: '40px' }}>
        {result.stages.map((stage, index) => {
          const stageConfigs = [
            {
              title: '🎯 阶段一：初始提案',
              description: '各个AI模型基于问题独立提供初始回答',
              icon: <RobotOutlined style={{ fontSize: '20px' }} />,
              color: '#4facfe'
            },
            {
              title: '🔄 阶段二：交叉审视与修正',
              description: '模型们互相审视其他模型的回答，并对自己的答案进行修正和优化',
              icon: <RobotOutlined style={{ fontSize: '20px' }} />,
              color: '#faad14'
            },
            {
              title: '✅ 阶段三：最终验证与综合',
              description: '综合所有观点，提供最终的准确答案',
              icon: <SafetyOutlined style={{ fontSize: '20px' }} />,
              color: '#52c41a'
            }
          ];

          const config = stageConfigs[index] || stageConfigs[stageConfigs.length - 1];
          
          return renderDebateStage(
            stage,
            index + 1,
            config.title,
            config.description,
            config.icon,
            config.color
          );
        })}
      </div>

      {/* 最终总结卡片 */}
      {result.summary && (
        <Card 
          style={{ 
            marginBottom: '32px',
            background: 'linear-gradient(135deg, #f6f9fc, #e8f5e8)',
            border: '2px solid #52c41a20',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(82, 196, 26, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #52c41a, #389e0d)',
              padding: '12px',
              borderRadius: '12px',
              color: 'white',
              fontSize: '20px'
            }}>
              🏆
            </div>
            <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
              AI辩论总结
            </Title>
          </div>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            border: '1px solid #f0f0f0'
          }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {result.summary}
            </ReactMarkdown>
          </div>
        </Card>
      )}

      {/* 底部统计总结 */}
      <Card 
        style={{ 
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e6f7ff 100%)',
          border: '2px solid #91d5ff',
          borderRadius: '16px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(24, 144, 255, 0.15)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center', marginBottom: '16px' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1890ff, #096dd9)',
            padding: '12px',
            borderRadius: '12px',
            color: 'white',
            fontSize: '20px'
          }}>
            🎉
          </div>
          <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
            辩论总结
          </Title>
        </div>
        <Text style={{ fontSize: '16px', lineHeight: '1.8', color: '#333' }}>
          本次辩论共有 <Text strong style={{ color: '#4facfe' }}>
            {result.stages.length > 0 ? result.stages[0].responses.length : 0} 个AI模型
          </Text> 参与，
          历时 <Text strong style={{ color: '#52c41a' }}>
            {Math.round(result.duration / 1000)} 秒
          </Text>，
          通过 <Text strong style={{ color: '#faad14' }}>
            {result.stages.length}个阶段
          </Text> 的深度讨论和验证，
          为您提供了经过充分思辨的答案。
        </Text>
      </Card>
    </div>
  );
};

export default ResultDisplay;

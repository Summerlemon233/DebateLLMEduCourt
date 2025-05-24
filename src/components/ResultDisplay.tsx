import React from 'react';
import { Card, Typography, Timeline, Badge, Empty, Divider, Tag } from 'antd';
import { 
  RobotOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SafetyOutlined,
  BulbOutlined,
  ExclamationCircleOutlined
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

  // 格式化时间戳
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 获取模型响应的状态标签
  const getResponseStatusBadge = (response: LLMResponse) => {
    if (response.success) {
      return <Badge status="success" text="成功" />;
    } else {
      return <Badge status="error" text="失败" />;
    }
  };

  // 渲染单个模型响应
  const renderModelResponse = (response: LLMResponse, index: number) => {
    return (
      <Card
        key={`${response.modelId}-${index}`}
        size="small"
        style={{
          marginBottom: '16px',
          border: response.success ? '1px solid #e1e5e9' : '1px solid #ffccc7',
          background: response.success ? 'white' : '#fff2f0',
        }}
      >
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RobotOutlined style={{ color: '#4facfe' }} />
              <Text strong style={{ fontSize: '16px' }}>
                {response.modelName}
              </Text>
              {getResponseStatusBadge(response)}
            </div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              <ClockCircleOutlined style={{ marginRight: '4px' }} />
              {formatTimestamp(response.timestamp)}
            </Text>
          </div>
        </div>

        {response.success ? (
          <Paragraph
            style={{
              background: '#f8f9fa',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: 0,
              whiteSpace: 'pre-wrap',
              lineHeight: '1.7',
            }}
          >
            {response.content}
          </Paragraph>
        ) : (
          <div style={{
            background: '#fff2f0',
            padding: '16px',
            borderRadius: '8px',
            border: '1px solid #ffccc7',
          }}>
            <Text type="danger">
              <ExclamationCircleOutlined style={{ marginRight: '8px' }} />
              错误: {response.error || '模型响应失败'}
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
      <div style={{ marginBottom: '32px' }}>
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
          <Tag color={color} style={{ marginLeft: 'auto' }}>
            {formatTimestamp(stage.timestamp)}
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
          {stage.responses.map((response, index) => 
            renderModelResponse(response, index)
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
              {result.stages.initial.responses.length}
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
              3
            </Title>
            <Text type="secondary">辩论阶段</Text>
          </div>
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
                  {formatTimestamp(result.stages.initial.timestamp)}
                </Text>
              </div>
            ),
          },
          {
            color: '#52c41a',
            dot: <CheckCircleOutlined style={{ fontSize: '16px' }} />,
            children: (
              <div>
                <Text strong>辩论完成</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  {formatTimestamp(result.stages.final.timestamp)}
                </Text>
              </div>
            ),
          },
        ]}
      />

      {/* 阶段一：初始提案 */}
      {renderDebateStage(
        result.stages.initial,
        1,
        '🎯 阶段一：初始提案',
        '各个AI模型基于问题独立提供初始回答',
        <RobotOutlined style={{ fontSize: '20px', color: '#4facfe' }} />,
        '#4facfe'
      )}

      {/* 阶段二：交叉审视 */}
      {renderDebateStage(
        result.stages.refined,
        2,
        '🔄 阶段二：交叉审视与修正',
        '模型们互相审视其他模型的回答，并对自己的答案进行修正和优化',
        <RobotOutlined style={{ fontSize: '20px', color: '#faad14' }} />,
        '#faad14'
      )}

      {/* 阶段三：最终验证 */}
      {renderDebateStage(
        result.stages.final,
        3,
        '✅ 阶段三：最终验证与综合',
        '验证者模型综合所有观点，提供最终的准确答案',
        <SafetyOutlined style={{ fontSize: '20px', color: '#52c41a' }} />,
        '#52c41a'
      )}

      {/* 底部总结 */}
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
          本次辩论共有 <Text strong>{result.stages.initial.responses.length} 个AI模型</Text> 参与，
          历时 <Text strong>{Math.round(result.duration / 1000)} 秒</Text>，
          通过 <Text strong>3个阶段</Text> 的深度讨论和验证，
          为您提供了经过充分思辨的答案。
        </Text>
      </Card>
    </div>
  );
};

export default ResultDisplay;

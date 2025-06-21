import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Tabs, 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Progress, 
  Timeline, 
  List, 
  Rate, 
  Button, 
  Divider,
  Space,
  Tooltip,
  Avatar,
  Badge,
  Statistic,
  Empty
} from 'antd';
import { 
  BookOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  StarOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DownloadOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  EyeOutlined,
  UserOutlined,
  BulbOutlined,
  BarChartOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { LearningResult, AgentOutput } from '../types';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface LearningResultDetailProps {
  visible: boolean;
  onClose: () => void;
  result: LearningResult;
  sessionMetadata?: {
    duration: number;
    agentCount: number;
    totalTokens: number;
    collaborationEfficiency: number;
  };
}

export const LearningResultDetail: React.FC<LearningResultDetailProps> = ({
  visible,
  onClose,
  result,
  sessionMetadata
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [downloadLoading, setDownloadLoading] = useState(false);

  // 计算学习质量分数
  const calculateQualityScore = (): number => {
    if (!result.agentContributions || result.agentContributions.length === 0) {
      return 75; // 默认分数
    }
    
    const avgConfidence = result.agentContributions.reduce(
      (sum, contribution) => sum + contribution.confidence, 0
    ) / result.agentContributions.length;
    
    return Math.round(avgConfidence * 100);
  };

  // 获取难度标签颜色
  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 3) return 'green';
    if (difficulty <= 7) return 'orange';
    return 'red';
  };

  // 获取智能体头像颜色
  const getAgentColor = (agentType: string): string => {
    const colors: Record<string, string> = {
      'curriculum-designer': '#1890ff',
      'content-generator': '#52c41a',
      'assessment-expert': '#faad14',
      'activity-designer': '#722ed1',
      'learning-analyst': '#eb2f96',
      'tutor-agent': '#13c2c2',
      'peer-learner': '#fa8c16',
      'reflection-guide': '#a0d911'
    };
    return colors[agentType] || '#666666';
  };

  // 导出学习成果
  const handleExport = async (format: 'pdf' | 'markdown' | 'json') => {
    setDownloadLoading(true);
    try {
      // 模拟导出过程
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (format === 'json') {
        // 导出JSON格式
        const dataStr = JSON.stringify(result, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `learning-result-${result.id}.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else if (format === 'markdown') {
        // 导出Markdown格式
        const markdown = generateMarkdown();
        const dataBlob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `learning-result-${result.id}.md`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('导出失败:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  // 生成Markdown格式内容
  const generateMarkdown = (): string => {
    return `
# 学习成果报告

## 基本信息
- **标题**: ${result.title}
- **类型**: ${result.type}
- **难度级别**: ${result.difficulty}/10
- **预计学习时间**: ${result.estimatedTime}分钟
- **创建时间**: ${new Date(result.createdAt).toLocaleString()}

## 学习目标
${result.learningObjectives.map(obj => `- ${obj}`).join('\n')}

## 前置要求
${result.prerequisites.map(req => `- ${req}`).join('\n')}

## 学习内容
${result.content}

## 智能体贡献
${result.agentContributions.map(contribution => `
### ${contribution.agentType}
- **置信度**: ${Math.round(contribution.confidence * 100)}%
- **处理时间**: ${contribution.metadata.processingTime}ms
- **使用令牌**: ${contribution.metadata.tokensUsed || 'N/A'}

**内容**:
${contribution.content}

${contribution.suggestions && contribution.suggestions.length > 0 ? `
**建议**:
${contribution.suggestions.map(s => `- ${s}`).join('\n')}
` : ''}
`).join('\n')}
    `.trim();
  };

  const qualityScore = calculateQualityScore();

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <span>学习成果详情</span>
          <Tag color={getDifficultyColor(result.difficulty)}>
            难度 {result.difficulty}/10
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width="90%"
      style={{ maxWidth: 1200 }}
      footer={[
        <Button key="close" onClick={onClose}>
          关闭
        </Button>,
        <Button
          key="export-md"
          icon={<DownloadOutlined />}
          onClick={() => handleExport('markdown')}
          loading={downloadLoading}
        >
          导出Markdown
        </Button>,
        <Button
          key="export-json"
          icon={<DownloadOutlined />}
          onClick={() => handleExport('json')}
          loading={downloadLoading}
        >
          导出JSON
        </Button>
      ]}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        {/* 概览信息 */}
        <TabPane 
          tab={
            <span>
              <EyeOutlined />
              概览
            </span>
          } 
          key="overview"
        >
          <Row gutter={[24, 24]}>
            {/* 基本信息 */}
            <Col xs={24} lg={16}>
              <Card size="small" title="学习内容">
                <div style={{ marginBottom: 16 }}>
                  <Title level={4}>{result.title}</Title>
                  <Space>
                    <Tag color="blue">{result.type}</Tag>
                    <Tag color={getDifficultyColor(result.difficulty)}>
                      难度 {result.difficulty}/10
                    </Tag>
                    <Tag icon={<ClockCircleOutlined />}>
                      {result.estimatedTime}分钟
                    </Tag>
                  </Space>
                </div>

                <Divider />

                <div style={{ marginBottom: 16 }}>
                  <Text strong>学习目标:</Text>
                  <List
                    size="small"
                    dataSource={result.learningObjectives}
                    renderItem={(objective, index) => (
                      <List.Item>
                        <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                        {objective}
                      </List.Item>
                    )}
                  />
                </div>

                {result.prerequisites.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <Text strong>前置要求:</Text>
                    <div style={{ marginTop: 8 }}>
                      {result.prerequisites.map((req, index) => (
                        <Tag key={index} style={{ marginBottom: 4 }}>
                          {req}
                        </Tag>
                      ))}
                    </div>
                  </div>
                )}

                <Divider />

                <div>
                  <Text strong>详细内容:</Text>
                  <Paragraph style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                    {result.content}
                  </Paragraph>
                </div>
              </Card>
            </Col>

            {/* 统计信息 */}
            <Col xs={24} lg={8}>
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {/* 质量评分 */}
                <Card size="small" title="质量评分">
                  <div style={{ textAlign: 'center' }}>
                    <Progress
                      type="circle"
                      percent={qualityScore}
                      strokeColor={qualityScore >= 80 ? '#52c41a' : qualityScore >= 60 ? '#faad14' : '#ff4d4f'}
                      size={120}
                    />
                    <div style={{ marginTop: 12 }}>
                      <Rate
                        disabled
                        value={qualityScore / 20}
                        style={{ fontSize: 16 }}
                      />
                    </div>
                  </div>
                </Card>

                {/* 会话统计 */}
                {sessionMetadata && (
                  <Card size="small" title="生成统计">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="耗时"
                          value={Math.round(sessionMetadata.duration / 1000)}
                          suffix="秒"
                          prefix={<ClockCircleOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="智能体"
                          value={sessionMetadata.agentCount}
                          suffix="个"
                          prefix={<UserOutlined />}
                        />
                      </Col>
                      <Col span={12} style={{ marginTop: 16 }}>
                        <Statistic
                          title="令牌数"
                          value={sessionMetadata.totalTokens}
                          prefix={<BarChartOutlined />}
                        />
                      </Col>
                      <Col span={12} style={{ marginTop: 16 }}>
                        <Statistic
                          title="协作效率"
                          value={sessionMetadata.collaborationEfficiency}
                          precision={1}
                          suffix="%"
                          prefix={<TrophyOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>
                )}

                {/* 快速操作 */}
                <Card size="small" title="操作">
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Button 
                      type="primary" 
                      icon={<BulbOutlined />} 
                      block
                      onClick={() => {
                        // 应用到学习计划
                        onClose();
                      }}
                    >
                      应用到学习计划
                    </Button>
                    <Button 
                      icon={<ShareAltOutlined />} 
                      block
                      onClick={() => {
                        // 分享功能
                        navigator.clipboard.writeText(window.location.href);
                      }}
                    >
                      分享学习成果
                    </Button>
                    <Button 
                      icon={<PrinterOutlined />} 
                      block
                      onClick={() => window.print()}
                    >
                      打印
                    </Button>
                  </Space>
                </Card>
              </Space>
            </Col>
          </Row>
        </TabPane>

        {/* 智能体贡献 */}
        <TabPane 
          tab={
            <span>
              <UserOutlined />
              智能体贡献
            </span>
          } 
          key="agents"
        >
          <Row gutter={[16, 16]}>
            {result.agentContributions.map((contribution, index) => (
              <Col xs={24} lg={12} key={index}>
                <Card 
                  size="small"
                  title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar 
                        size="small" 
                        style={{ backgroundColor: getAgentColor(contribution.agentType) }}
                      >
                        {contribution.agentType.charAt(0).toUpperCase()}
                      </Avatar>
                      <span>{contribution.agentType}</span>
                      <Badge 
                        count={`${Math.round(contribution.confidence * 100)}%`} 
                        style={{ backgroundColor: getAgentColor(contribution.agentType) }}
                      />
                    </div>
                  }
                >
                  <div style={{ marginBottom: 12 }}>
                    <Row gutter={16}>
                      <Col span={8}>
                        <Statistic
                          title="置信度"
                          value={contribution.confidence}
                          precision={2}
                          suffix="%"
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="处理时间"
                          value={contribution.metadata.processingTime}
                          suffix="ms"
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                      <Col span={8}>
                        <Statistic
                          title="令牌数"
                          value={contribution.metadata.tokensUsed || 0}
                          valueStyle={{ fontSize: 14 }}
                        />
                      </Col>
                    </Row>
                  </div>

                  <Divider />

                  <div style={{ marginBottom: 12 }}>
                    <Text strong>贡献内容:</Text>
                    <Paragraph 
                      style={{ marginTop: 8 }}
                      ellipsis={{ rows: 4, expandable: true }}
                    >
                      {contribution.content}
                    </Paragraph>
                  </div>

                  {contribution.suggestions && contribution.suggestions.length > 0 && (
                    <div>
                      <Text strong>建议:</Text>
                      <List
                        size="small"
                        dataSource={contribution.suggestions}
                        renderItem={(suggestion) => (
                          <List.Item>
                            <BulbOutlined style={{ color: '#faad14', marginRight: 8 }} />
                            {suggestion}
                          </List.Item>
                        )}
                      />
                    </div>
                  )}

                  {contribution.metadata.sources && contribution.metadata.sources.length > 0 && (
                    <div style={{ marginTop: 12 }}>
                      <Text strong>参考来源:</Text>
                      <div style={{ marginTop: 4 }}>
                        {contribution.metadata.sources.map((source, idx) => (
                          <Tag key={idx} style={{ marginBottom: 4 }}>
                            {source}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </Col>
            ))}
          </Row>

          {result.agentContributions.length === 0 && (
            <Empty 
              description="暂无智能体贡献数据"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </TabPane>

        {/* 学习时间线 */}
        <TabPane 
          tab={
            <span>
              <ClockCircleOutlined />
              时间线
            </span>
          } 
          key="timeline"
        >
          <Timeline>
            <Timeline.Item 
              dot={<StarOutlined style={{ fontSize: '16px', color: '#1890ff' }} />}
              color="blue"
            >
              <div>
                <Text strong>学习内容生成开始</Text>
                <br />
                <Text type="secondary">{new Date(result.createdAt).toLocaleString()}</Text>
              </div>
            </Timeline.Item>
            
            {result.agentContributions.map((contribution, index) => (
              <Timeline.Item 
                key={index}
                dot={
                  <Avatar 
                    size="small" 
                    style={{ backgroundColor: getAgentColor(contribution.agentType) }}
                  >
                    {contribution.agentType.charAt(0).toUpperCase()}
                  </Avatar>
                }
              >
                <div>
                  <Text strong>{contribution.agentType} 完成处理</Text>
                  <br />
                  <Text type="secondary">
                    处理时间: {contribution.metadata.processingTime}ms | 
                    置信度: {Math.round(contribution.confidence * 100)}%
                  </Text>
                  <br />
                  <Paragraph 
                    ellipsis={{ rows: 2, expandable: true }}
                    style={{ marginTop: 4, marginBottom: 0 }}
                  >
                    {contribution.content}
                  </Paragraph>
                </div>
              </Timeline.Item>
            ))}
            
            <Timeline.Item 
              dot={<CheckCircleOutlined style={{ fontSize: '16px', color: '#52c41a' }} />}
              color="green"
            >
              <div>
                <Text strong>学习内容生成完成</Text>
                <br />
                <Text type="secondary">
                  总计: {result.agentContributions.length}个智能体协作完成
                </Text>
              </div>
            </Timeline.Item>
          </Timeline>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

export default LearningResultDetail;

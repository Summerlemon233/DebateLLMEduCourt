import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Input, 
  Select, 
  Progress, 
  Tag, 
  Avatar, 
  Tooltip,
  message,
  Spin,
  Typography
} from 'antd';
import { 
  RobotOutlined,
  BulbOutlined,
  BookOutlined,
  TrophyOutlined,
  PlayCircleOutlined,
  SettingOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { LearnerProfile, Recommendation } from '../types';
import LearningResultDetail from './LearningResultDetail';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface MultiAgentDashboardProps {
  userProfile?: LearnerProfile;
  onProfileUpdate?: (profile: LearnerProfile) => void;
}

interface LearningSession {
  id: string;
  workflowType: string;
  topic: string;
  status: 'idle' | 'running' | 'completed' | 'error';
  progress: number;
  agentsInvolved: string[];
  startTime?: Date;
  duration?: number;
  result?: any;
}

export const MultiAgentDashboard: React.FC<MultiAgentDashboardProps> = ({
  userProfile,
  onProfileUpdate
}) => {
  // 状态管理
  const [learningTopic, setLearningTopic] = useState('');
  const [learningGoals, setLearningGoals] = useState('');
  const [selectedWorkflow, setSelectedWorkflow] = useState('complete-learning');
  const [currentSession, setCurrentSession] = useState<LearningSession | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId] = useState(() => `user-${Date.now()}`); // 临时用户ID
  const [resultDetailVisible, setResultDetailVisible] = useState(false);

  // 可用的工作流
  const availableWorkflows = [
    {
      id: 'complete-learning',
      name: '完整学习流程',
      description: '从课程设计到评估的完整体验',
      agents: ['课程设计师', '内容生成器', '活动设计师', '评估专家'],
      estimatedTime: '5分钟',
      icon: <BookOutlined />,
    },
    {
      id: 'quick-content',
      name: '快速内容生成',
      description: '快速生成学习内容和练习',
      agents: ['内容生成器', '活动设计师'],
      estimatedTime: '2分钟',
      icon: <BulbOutlined />,
    },
    {
      id: 'assessment-focused',
      name: '评估导向学习',
      description: '以评估为核心的学习设计',
      agents: ['评估专家', '课程设计师', '内容生成器'],
      estimatedTime: '4分钟',
      icon: <TrophyOutlined />,
    },
  ];

  // 智能体信息
  const agentInfo = {
    '课程设计师': { color: '#1890ff', icon: '📚' },
    '内容生成器': { color: '#52c41a', icon: '✍️' },
    '评估专家': { color: '#faad14', icon: '📊' },
    '活动设计师': { color: '#eb2f96', icon: '🎯' },
  };

  // 加载用户画像和推荐
  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadRecommendations();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch(`/api/learner-profile/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (onProfileUpdate && data.profile) {
          onProfileUpdate(data.profile);
        }
      }
    } catch (error) {
      console.error('加载用户画像失败:', error);
    }
  };

  const loadRecommendations = async () => {
    try {
      const response = await fetch(`/api/learner-profile/${userId}?action=recommendations`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('加载推荐失败:', error);
    }
  };

  // 开始学习会话
  const startLearningSession = async () => {
    if (!learningTopic.trim()) {
      message.warning('请输入学习主题');
      return;
    }

    setIsLoading(true);
    const sessionId = `session-${Date.now()}`;
    
    const newSession: LearningSession = {
      id: sessionId,
      workflowType: selectedWorkflow,
      topic: learningTopic,
      status: 'running',
      progress: 0,
      agentsInvolved: availableWorkflows.find(w => w.id === selectedWorkflow)?.agents || [],
      startTime: new Date(),
    };

    setCurrentSession(newSession);

    try {
      const response = await fetch('/api/multi-agent-learning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflowType: selectedWorkflow,
          topic: learningTopic,
          learningGoals: learningGoals.split('\n').filter(goal => goal.trim()),
          difficulty: userProfile?.adaptationSettings?.contentDifficulty || 5,
          userProfile,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // 模拟进度更新
        await simulateProgress(newSession);
        
        // 更新会话状态
        setCurrentSession(prev => prev ? {
          ...prev,
          status: 'completed',
          progress: 100,
          duration: Date.now() - (prev.startTime?.getTime() || 0),
          result: result.result,
        } : null);

        // 记录学习会话
        await recordLearningSession(sessionId, learningTopic);
        
        message.success('学习会话完成！');
      } else {
        throw new Error('学习会话启动失败');
      }
    } catch (error) {
      console.error('学习会话错误:', error);
      setCurrentSession(prev => prev ? { ...prev, status: 'error' } : null);
      message.error('学习会话失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 模拟进度更新
  const simulateProgress = async (session: LearningSession) => {
    const totalSteps = session.agentsInvolved.length;
    for (let i = 0; i < totalSteps; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const progress = ((i + 1) / totalSteps) * 100;
      setCurrentSession(prev => prev ? { ...prev, progress } : null);
    }
  };

  // 记录学习会话
  const recordLearningSession = async (sessionId: string, topic: string) => {
    try {
      await fetch(`/api/learner-profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'record-session',
          duration: 30, // 假设30分钟
          topic,
          performance: 0.8, // 假设80%的表现
        }),
      });
    } catch (error) {
      console.error('记录学习会话失败:', error);
    }
  };

  // 应用推荐
  const applyRecommendation = (recommendation: Recommendation) => {
    setLearningTopic(recommendation.title);
    setLearningGoals(recommendation.learningObjectives.join('\n'));
    
    // 根据推荐类型选择工作流
    if (recommendation.type === 'practice') {
      setSelectedWorkflow('quick-content');
    } else if (recommendation.type === 'review') {
      setSelectedWorkflow('assessment-focused');
    } else {
      setSelectedWorkflow('complete-learning');
    }

    message.success(`已应用推荐: ${recommendation.title}`);
  };

  return (
    <div className="multi-agent-dashboard">
      <Row gutter={[24, 24]}>
        {/* 学习控制面板 */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <RobotOutlined style={{ color: '#1890ff' }} />
                <span>多智能体学习中心</span>
              </div>
            }
            extra={
              <Tooltip title="个性化设置">
                <Button icon={<SettingOutlined />} type="text" />
              </Tooltip>
            }
          >
            {/* 学习主题输入 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>学习主题</Text>
              <Input
                placeholder="请输入您想学习的主题..."
                value={learningTopic}
                onChange={(e) => setLearningTopic(e.target.value)}
                style={{ marginTop: 8 }}
                size="large"
              />
            </div>

            {/* 学习目标输入 */}
            <div style={{ marginBottom: 16 }}>
              <Text strong>学习目标 (每行一个)</Text>
              <TextArea
                placeholder="请输入具体的学习目标&#10;例如：&#10;理解基本概念&#10;掌握实际应用&#10;能够独立解决问题"
                value={learningGoals}
                onChange={(e) => setLearningGoals(e.target.value)}
                rows={3}
                style={{ marginTop: 8 }}
              />
            </div>

            {/* 工作流选择 */}
            <div style={{ marginBottom: 24 }}>
              <Text strong>学习模式</Text>
              <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                {availableWorkflows.map((workflow) => (
                  <Col xs={24} sm={8} key={workflow.id}>
                    <Card
                      size="small"
                      hoverable
                      onClick={() => setSelectedWorkflow(workflow.id)}
                      style={{
                        border: selectedWorkflow === workflow.id ? '2px solid #1890ff' : '1px solid #d9d9d9',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 24, marginBottom: 8 }}>
                          {workflow.icon}
                        </div>
                        <Title level={5} style={{ margin: '0 0 8px 0' }}>
                          {workflow.name}
                        </Title>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {workflow.description}
                        </Text>
                        <div style={{ marginTop: 8 }}>
                          <Tag color="blue" icon={<ClockCircleOutlined />}>
                            {workflow.estimatedTime}
                          </Tag>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          {workflow.agents.map((agent) => (
                            <Tag 
                              key={agent}
                              color={agentInfo[agent as keyof typeof agentInfo]?.color}
                              style={{ margin: '2px', fontSize: 10 }}
                            >
                              {agentInfo[agent as keyof typeof agentInfo]?.icon} {agent}
                            </Tag>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>

            {/* 开始按钮 */}
            <div style={{ textAlign: 'center' }}>
              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined />}
                onClick={startLearningSession}
                loading={isLoading}
                disabled={!learningTopic.trim() || currentSession?.status === 'running'}
                style={{ minWidth: 200 }}
              >
                {currentSession?.status === 'running' ? '学习进行中...' : '开始AI学习'}
              </Button>
            </div>
          </Card>

          {/* 学习进度 */}
          {currentSession && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                title="学习进度" 
                style={{ marginTop: 24 }}
              >
                <div style={{ marginBottom: 16 }}>
                  <Text strong>当前主题:</Text> {currentSession.topic}
                </div>
                
                <Progress 
                  percent={Math.round(currentSession.progress)} 
                  status={currentSession.status === 'error' ? 'exception' : 'active'}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />

                <div style={{ marginTop: 16 }}>
                  <Text strong>参与智能体:</Text>
                  <div style={{ marginTop: 8 }}>
                    {currentSession.agentsInvolved.map((agent, index) => (
                      <Tag
                        key={agent}
                        color={agentInfo[agent as keyof typeof agentInfo]?.color}
                        style={{ margin: 4 }}
                      >
                        <Avatar 
                          size="small" 
                          style={{ 
                            backgroundColor: agentInfo[agent as keyof typeof agentInfo]?.color,
                            marginRight: 4 
                          }}
                        >
                          {agentInfo[agent as keyof typeof agentInfo]?.icon}
                        </Avatar>
                        {agent}
                        {index < Math.floor(currentSession.progress / (100 / currentSession.agentsInvolved.length)) && (
                          <span style={{ marginLeft: 4, color: '#52c41a' }}>✓</span>
                        )}
                      </Tag>
                    ))}
                  </div>
                </div>

                {currentSession.status === 'completed' && currentSession.result && (
                  <div style={{ marginTop: 16 }}>
                    <Text strong>学习结果已生成</Text>
                    <Button 
                      type="link" 
                      onClick={() => {
                        setResultDetailVisible(true);
                      }}
                    >
                      查看详细结果 →
                    </Button>
                  </div>
                )}
              </Card>
            </motion.div>
          )}
        </Col>

        {/* 侧边栏 */}
        <Col xs={24} lg={8}>
          {/* 用户画像卡片 */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserOutlined />
                <span>学习画像</span>
              </div>
            }
            size="small"
          >
            {userProfile ? (
              <div>
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary">学习风格:</Text>
                  <div>
                    <Tag color="blue">{userProfile.learningStyle.visualAuditory}</Tag>
                    <Tag color="green">{userProfile.learningStyle.pace}</Tag>
                  </div>
                </div>
                
                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary">总学习时长:</Text>
                  <div>
                    <Text strong>{Math.round(userProfile.learningHistory.totalTimeSpent / 60)}小时</Text>
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <Text type="secondary">学习偏好:</Text>
                  <div>
                    {userProfile.preferences.contentFormat.map(format => (
                      <Tag key={format} color="orange">{format}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Spin size="small" />
            )}
          </Card>

          {/* 个性化推荐 */}
          <Card 
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BulbOutlined style={{ color: '#faad14' }} />
                <span>智能推荐</span>
              </div>
            }
            size="small"
            style={{ marginTop: 16 }}
          >
            {recommendations.length > 0 ? (
              <div>
                {recommendations.slice(0, 3).map((rec) => (
                  <Card
                    key={rec.id}
                    size="small"
                    hoverable
                    style={{ marginBottom: 12, cursor: 'pointer' }}
                    onClick={() => applyRecommendation(rec)}
                  >
                    <div>
                      <Text strong style={{ fontSize: 12 }}>{rec.title}</Text>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          {rec.description}
                        </Text>
                      </div>
                      <div style={{ marginTop: 8 }}>
                        <Tag color="blue" style={{ fontSize: 11 }}>
                          {rec.estimatedTime}分钟
                        </Tag>
                        <Tag color="orange" style={{ fontSize: 11 }}>
                          难度{rec.difficulty}
                        </Tag>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Text type="secondary">暂无推荐内容</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* 学习成果详情模态框 */}
      {currentSession?.result && (
        <LearningResultDetail
          visible={resultDetailVisible}
          onClose={() => setResultDetailVisible(false)}
          result={currentSession.result}
          sessionMetadata={{
            duration: currentSession.duration || 0,
            agentCount: currentSession.agentsInvolved.length,
            totalTokens: currentSession.result.agentContributions?.reduce(
              (sum: number, contrib: any) => sum + (contrib.metadata.tokensUsed || 0), 0
            ) || 0,
            collaborationEfficiency: 85 // 模拟数据
          }}
        />
      )}
    </div>
  );
};

export default MultiAgentDashboard;

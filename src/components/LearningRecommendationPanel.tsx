import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Button, 
  Tag, 
  Typography,
  Spin,
  Empty,
  Rate,
  Progress,
  Tooltip,
  Avatar,
  message,
  Badge
} from 'antd';
import { 
  BookOutlined,
  PlayCircleOutlined,
  ClockCircleOutlined,
  StarOutlined,
  TeamOutlined,
  ExperimentOutlined,
  TrophyOutlined,
  RightOutlined,
  LikeOutlined,
  ShareAltOutlined
} from '@ant-design/icons';
import { LearnerProfile, LearningRecommendation, Agent } from '../types';

const { Title, Text, Paragraph } = Typography;

interface LearningRecommendationPanelProps {
  userId: string;
  profile?: LearnerProfile;
  availableAgents?: Agent[];
  onStartRecommendation?: (recommendation: LearningRecommendation) => void;
}

export const LearningRecommendationPanel: React.FC<LearningRecommendationPanelProps> = ({
  userId,
  profile,
  availableAgents = [],
  onStartRecommendation
}) => {
  const [recommendations, setRecommendations] = useState<LearningRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  useEffect(() => {
    if (userId) {
      loadRecommendations();
    }
  }, [userId, profile]);

  const loadRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/learner-profile/${userId}?action=recommendations`);
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      }
    } catch (error) {
      console.error('加载推荐失败:', error);
      message.error('加载推荐失败');
    } finally {
      setLoading(false);
    }
  };

  const handleStartRecommendation = async (recommendation: LearningRecommendation) => {
    try {
      // 记录推荐点击
      await fetch(`/api/learner-profile/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'track_recommendation_click',
          recommendationId: recommendation.id,
          type: recommendation.type
        }),
      });

      if (onStartRecommendation) {
        onStartRecommendation(recommendation);
      }
    } catch (error) {
      console.error('启动推荐失败:', error);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'content':
        return <BookOutlined />;
      case 'practice':
        return <ExperimentOutlined />;
      case 'collaboration':
        return <TeamOutlined />;
      case 'achievement':
        return <TrophyOutlined />;
      default:
        return <StarOutlined />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'content':
        return '#1890ff';
      case 'practice':
        return '#52c41a';
      case 'collaboration':
        return '#fa8c16';
      case 'achievement':
        return '#faad14';
      default:
        return '#722ed1';
    }
  };

  const getDifficultyTag = (difficulty: number) => {
    if (difficulty <= 3) {
      return <Tag color="green">简单</Tag>;
    } else if (difficulty <= 7) {
      return <Tag color="orange">适中</Tag>;
    } else {
      return <Tag color="red">困难</Tag>;
    }
  };

  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'content':
        return '内容学习';
      case 'practice':
        return '实践练习';
      case 'collaboration':
        return '协作学习';
      case 'achievement':
        return '成就解锁';
      default:
        return '其他';
    }
  };

  const categories = [
    { key: 'all', label: '全部推荐' },
    { key: 'content', label: '内容学习' },
    { key: 'practice', label: '实践练习' },
    { key: 'collaboration', label: '协作学习' },
    { key: 'achievement', label: '成就解锁' },
  ];

  const filteredRecommendations = activeCategory === 'all' 
    ? recommendations 
    : recommendations.filter(rec => rec.type === activeCategory);

  if (loading) {
    return (
      <Card title="学习推荐">
        <div style={{ textAlign: 'center', padding: 48 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">正在为您生成个性化推荐...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="learning-recommendation-panel">
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <StarOutlined style={{ marginRight: 8 }} />
              个性化学习推荐
            </span>
            <Button 
              type="link" 
              size="small" 
              onClick={loadRecommendations}
              loading={loading}
            >
              刷新推荐
            </Button>
          </div>
        }
      >
        {/* 分类筛选 */}
        <div style={{ marginBottom: 24 }}>
          <Row gutter={8}>
            {categories.map(category => (
              <Col key={category.key}>
                <Button
                  type={activeCategory === category.key ? 'primary' : 'default'}
                  size="small"
                  onClick={() => setActiveCategory(category.key)}
                >
                  {category.label}
                </Button>
              </Col>
            ))}
          </Row>
        </div>

        {/* 推荐列表 */}
        {filteredRecommendations.length === 0 ? (
          <Empty 
            description="暂无推荐内容"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[16, 16]}>
            {filteredRecommendations.map((recommendation, index) => (
              <Col xs={24} sm={12} lg={8} key={recommendation.id || index}>
                <Badge.Ribbon 
                  text={getTypeDisplayName(recommendation.type)} 
                  color={getRecommendationColor(recommendation.type)}
                >
                  <Card
                    size="small"
                    hoverable
                    actions={[
                      <Tooltip title="开始学习">
                        <Button 
                          type="primary" 
                          icon={<PlayCircleOutlined />}
                          onClick={() => handleStartRecommendation(recommendation)}
                        >
                          开始
                        </Button>
                      </Tooltip>,
                      <Tooltip title="喜欢">
                        <LikeOutlined />
                      </Tooltip>,
                      <Tooltip title="分享">
                        <ShareAltOutlined />
                      </Tooltip>
                    ]}
                  >
                    <div>
                      {/* 推荐标题 */}
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ 
                          fontSize: 24, 
                          color: getRecommendationColor(recommendation.type),
                          marginRight: 8 
                        }}>
                          {getRecommendationIcon(recommendation.type)}
                        </div>
                        <Text strong style={{ fontSize: 14 }}>
                          {recommendation.title}
                        </Text>
                      </div>

                      {/* 推荐描述 */}
                      <Paragraph 
                        ellipsis={{ rows: 2, expandable: false }}
                        style={{ marginBottom: 12, fontSize: 12 }}
                      >
                        {recommendation.description}
                      </Paragraph>

                      {/* 推荐信息 */}
                      <div style={{ marginBottom: 12 }}>
                        <Row gutter={8} align="middle">
                          <Col>
                            {getDifficultyTag(recommendation.difficulty)}
                          </Col>
                          <Col>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {recommendation.estimatedTime}分钟
                            </Text>
                          </Col>
                        </Row>

                        {/* 推荐原因 */}
                        <div style={{ marginTop: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            推荐原因: {recommendation.reason}
                          </Text>
                        </div>
                      </div>

                      {/* 智能体信息 */}
                      {recommendation.agentId && (
                        <div style={{ marginBottom: 8 }}>
                          {(() => {
                            const agent = availableAgents.find(a => a.id === recommendation.agentId);
                            return agent ? (
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Avatar size="small" style={{ backgroundColor: agent.avatar || '#1890ff' }}>
                                  {agent.name.charAt(0)}
                                </Avatar>
                                <Text style={{ marginLeft: 8, fontSize: 11 }}>
                                  由 {agent.name} 推荐
                                </Text>
                              </div>
                            ) : null;
                          })()}
                        </div>
                      )}

                      {/* 置信度 */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <Text type="secondary" style={{ fontSize: 10 }}>匹配度</Text>
                          <Progress 
                            percent={Math.round(recommendation.confidence * 100)} 
                            size="small"
                            strokeColor={getRecommendationColor(recommendation.type)}
                          />
                        </div>
                        <Rate 
                          disabled 
                          value={recommendation.confidence * 5} 
                          style={{ fontSize: 12 }}
                        />
                      </div>
                    </div>
                  </Card>
                </Badge.Ribbon>
              </Col>
            ))}
          </Row>
        )}

        {/* 基于学习历史的智能提示 */}
        {profile && profile.learningHistory.totalSessions > 0 && (
          <div style={{ marginTop: 24, padding: 16, backgroundColor: '#f6ffed', borderRadius: 6 }}>
            <Title level={5} style={{ marginBottom: 8 }}>
              <StarOutlined style={{ color: '#52c41a', marginRight: 8 }} />
              智能洞察
            </Title>
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • 您最活跃的学习时间是 {profile.learningStyle.preferredTime}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • 推荐难度级别: {profile.adaptationSettings.contentDifficulty}/10
                </Text>
              </Col>
              <Col xs={24} sm={12}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • 您偏好的学习方式: {profile.learningStyle.visualAuditory}
                </Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  • 建议会话时长: {profile.preferences.sessionLength}分钟
                </Text>
              </Col>
            </Row>
          </div>
        )}
      </Card>
    </div>
  );
};

export default LearningRecommendationPanel;

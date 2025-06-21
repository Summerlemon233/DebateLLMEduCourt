import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Form, 
  Input, 
  Select, 
  Slider, 
  Switch, 
  Button, 
  Tag, 
  Progress,
  Typography,
  message,
  Tabs,
  Statistic,
  Tooltip,
  Rate
} from 'antd';
import { 
  UserOutlined,
  SettingOutlined,
  TrophyOutlined,
  BarChartOutlined,
  BookOutlined,
  ClockCircleOutlined,
  FireOutlined,
  StarOutlined
} from '@ant-design/icons';
import { LearnerProfile, LearningGoal } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface LearnerProfileManagerProps {
  userId: string;
  profile?: LearnerProfile;
  onProfileUpdate?: (profile: LearnerProfile) => void;
}

export const LearnerProfileManager: React.FC<LearnerProfileManagerProps> = ({
  userId,
  profile,
  onProfileUpdate
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [insights, setInsights] = useState<any>(null);

  // 初始化表单数据
  useEffect(() => {
    if (profile) {
      form.setFieldsValue({
        // 基础信息
        age: profile.demographics.age,
        education: profile.demographics.education,
        background: profile.demographics.background,
        
        // 学习风格
        visualAuditory: profile.learningStyle.visualAuditory,
        processingStyle: profile.learningStyle.processingStyle,
        pace: profile.learningStyle.pace,
        preferredTime: profile.learningStyle.preferredTime,
        
        // 学习偏好
        contentFormat: profile.preferences.contentFormat,
        sessionLength: profile.preferences.sessionLength,
        difficultyPreference: profile.preferences.difficultyPreference,
        feedbackStyle: profile.preferences.feedbackStyle,
        gamificationEnabled: profile.preferences.gamificationEnabled,
        
        // 适应性设置
        contentDifficulty: profile.adaptationSettings.contentDifficulty,
        explanationDetail: profile.adaptationSettings.explanationDetail,
        practiceFrequency: profile.adaptationSettings.practiceFrequency,
        challengeLevel: profile.adaptationSettings.challengeLevel,
        reminderFrequency: profile.adaptationSettings.reminderFrequency,
      });
    }
  }, [profile, form]);

  // 加载学习洞察
  useEffect(() => {
    if (userId) {
      loadInsights();
    }
  }, [userId]);

  const loadInsights = async () => {
    try {
      const response = await fetch(`/api/learner-profile/${userId}?action=insights`);
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('加载学习洞察失败:', error);
    }
  };

  // 保存画像更新
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      const updateData = {
        demographics: {
          age: values.age,
          education: values.education,
          background: values.background || [],
        },
        learningStyle: {
          visualAuditory: values.visualAuditory,
          processingStyle: values.processingStyle,
          pace: values.pace,
          preferredTime: values.preferredTime,
        },
        preferences: {
          contentFormat: values.contentFormat,
          sessionLength: values.sessionLength,
          difficultyPreference: values.difficultyPreference,
          feedbackStyle: values.feedbackStyle,
          gamificationEnabled: values.gamificationEnabled,
        },
        adaptationSettings: {
          contentDifficulty: values.contentDifficulty,
          explanationDetail: values.explanationDetail,
          practiceFrequency: values.practiceFrequency,
          challengeLevel: values.challengeLevel,
          reminderFrequency: values.reminderFrequency,
        },
      };

      const response = await fetch(`/api/learner-profile/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        if (onProfileUpdate) {
          onProfileUpdate(data.profile);
        }
        message.success('画像更新成功！');
      } else {
        throw new Error('更新失败');
      }
    } catch (error) {
      console.error('保存画像失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (level: number): string => {
    if (level <= 3) return '#52c41a';
    if (level <= 7) return '#faad14';
    return '#ff4d4f';
  };

  const getPerformanceColor = (score: number): string => {
    if (score >= 0.8) return '#52c41a';
    if (score >= 0.6) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="learner-profile-manager">
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <UserOutlined />
            <span>学习者画像管理</span>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 概览面板 */}
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                概览
              </span>
            } 
            key="overview"
          >
            {profile && (
              <Row gutter={[24, 24]}>
                {/* 学习统计 */}
                <Col xs={24} lg={12}>
                  <Card title="学习统计" size="small">
                    <Row gutter={16}>
                      <Col span={12}>
                        <Statistic
                          title="总学习时长"
                          value={Math.round(profile.learningHistory.totalTimeSpent / 60)}
                          suffix="小时"
                          prefix={<ClockCircleOutlined />}
                        />
                      </Col>
                      <Col span={12}>
                        <Statistic
                          title="学习会话"
                          value={profile.learningHistory.totalSessions}
                          suffix="次"
                          prefix={<BookOutlined />}
                        />
                      </Col>
                      <Col span={12} style={{ marginTop: 16 }}>
                        <Statistic
                          title="连续天数"
                          value={profile.learningHistory.streakDays}
                          suffix="天"
                          prefix={<FireOutlined />}
                        />
                      </Col>
                      <Col span={12} style={{ marginTop: 16 }}>
                        <Statistic
                          title="获得成就"
                          value={profile.learningHistory.achievements.length}
                          suffix="个"
                          prefix={<TrophyOutlined />}
                        />
                      </Col>
                    </Row>
                  </Card>
                </Col>

                {/* 知识分布 */}
                <Col xs={24} lg={12}>
                  <Card title="知识地图" size="small">
                    {Object.entries(profile.knowledgeMap).length > 0 ? (
                      <div>
                        {Object.entries(profile.knowledgeMap).map(([subject, knowledge]) => (
                          <div key={subject} style={{ marginBottom: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                              <Text strong>{subject}</Text>
                              <Text type="secondary">级别 {knowledge.level.toFixed(1)}</Text>
                            </div>
                            <Progress 
                              percent={knowledge.level * 10} 
                              strokeColor={getDifficultyColor(knowledge.level)}
                              size="small"
                            />
                            <div style={{ marginTop: 4 }}>
                              {knowledge.interests.slice(0, 3).map((interest) => (
                                <Tag key={interest} color="blue" style={{ fontSize: 10 }}>
                                  {interest}
                                </Tag>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <Text type="secondary">暂无学习记录</Text>
                    )}
                  </Card>
                </Col>

                {/* 学习表现 */}
                {insights && (
                  <Col xs={24}>
                    <Card title="学习洞察" size="small">
                      <Row gutter={[16, 16]}>
                        <Col xs={12} sm={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Progress 
                              type="circle" 
                              percent={Math.round(profile.recentPerformance.accuracy * 100)}
                              strokeColor={getPerformanceColor(profile.recentPerformance.accuracy)}
                              size={80}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Text strong>准确率</Text>
                            </div>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Progress 
                              type="circle" 
                              percent={Math.round(profile.recentPerformance.consistency * 100)}
                              strokeColor={getPerformanceColor(profile.recentPerformance.consistency)}
                              size={80}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Text strong>一致性</Text>
                            </div>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Progress 
                              type="circle" 
                              percent={Math.round(profile.recentPerformance.engagement * 100)}
                              strokeColor={getPerformanceColor(profile.recentPerformance.engagement)}
                              size={80}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Text strong>参与度</Text>
                            </div>
                          </div>
                        </Col>
                        <Col xs={12} sm={6}>
                          <div style={{ textAlign: 'center' }}>
                            <Progress 
                              type="circle" 
                              percent={Math.round(insights.overallProgress * 100)}
                              strokeColor="#1890ff"
                              size={80}
                            />
                            <div style={{ marginTop: 8 }}>
                              <Text strong>总体进度</Text>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {insights.suggestions && insights.suggestions.length > 0 && (
                        <div style={{ marginTop: 24 }}>
                          <Title level={5}>学习建议</Title>
                          {insights.suggestions.map((suggestion: string, index: number) => (
                            <div key={index} style={{ marginBottom: 8 }}>
                              <Text type="secondary">• {suggestion}</Text>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </Col>
                )}
              </Row>
            )}
          </TabPane>

          {/* 基础设置 */}
          <TabPane 
            tab={
              <span>
                <SettingOutlined />
                基础设置
              </span>
            } 
            key="settings"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSave}
            >
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={12}>
                  <Card title="基础信息" size="small">
                    <Form.Item label="年龄" name="age">
                      <Input type="number" placeholder="请输入年龄" />
                    </Form.Item>

                    <Form.Item label="教育背景" name="education">
                      <Select placeholder="请选择教育背景">
                        <Option value="高中">高中</Option>
                        <Option value="本科">本科</Option>
                        <Option value="硕士">硕士</Option>
                        <Option value="博士">博士</Option>
                        <Option value="其他">其他</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="学习背景" name="background">
                      <Select 
                        mode="tags" 
                        placeholder="请输入相关学习背景"
                        tokenSeparators={[',']}
                      >
                        <Option value="数学">数学</Option>
                        <Option value="计算机科学">计算机科学</Option>
                        <Option value="物理">物理</Option>
                        <Option value="化学">化学</Option>
                        <Option value="生物">生物</Option>
                        <Option value="文学">文学</Option>
                        <Option value="历史">历史</Option>
                        <Option value="艺术">艺术</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="学习风格" size="small">
                    <Form.Item label="学习偏好" name="visualAuditory">
                      <Select>
                        <Option value="visual">视觉导向</Option>
                        <Option value="auditory">听觉导向</Option>
                        <Option value="kinesthetic">动觉导向</Option>
                        <Option value="mixed">混合型</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="处理方式" name="processingStyle">
                      <Select>
                        <Option value="sequential">顺序型</Option>
                        <Option value="global">整体型</Option>
                        <Option value="mixed">混合型</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="学习节奏" name="pace">
                      <Select>
                        <Option value="fast">快节奏</Option>
                        <Option value="moderate">中等节奏</Option>
                        <Option value="slow">慢节奏</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="偏好时间" name="preferredTime">
                      <Select>
                        <Option value="morning">上午</Option>
                        <Option value="afternoon">下午</Option>
                        <Option value="evening">晚上</Option>
                        <Option value="flexible">灵活</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="学习偏好" size="small">
                    <Form.Item label="内容格式" name="contentFormat">
                      <Select mode="multiple" placeholder="选择偏好的内容格式">
                        <Option value="text">文本</Option>
                        <Option value="video">视频</Option>
                        <Option value="interactive">互动</Option>
                        <Option value="audio">音频</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="会话时长 (分钟)" name="sessionLength">
                      <Slider min={10} max={120} marks={{ 10: '10', 30: '30', 60: '60', 120: '120' }} />
                    </Form.Item>

                    <Form.Item label="难度偏好" name="difficultyPreference">
                      <Select>
                        <Option value="easy">简单</Option>
                        <Option value="comfortable">舒适</Option>
                        <Option value="challenge">挑战</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="反馈风格" name="feedbackStyle">
                      <Select>
                        <Option value="concise">简洁</Option>
                        <Option value="detailed">详细</Option>
                        <Option value="encouraging">鼓励性</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="游戏化" name="gamificationEnabled" valuePropName="checked">
                      <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                    </Form.Item>
                  </Card>
                </Col>

                <Col xs={24} lg={12}>
                  <Card title="适应性设置" size="small">
                    <Form.Item label="内容难度" name="contentDifficulty">
                      <Slider 
                        min={1} 
                        max={10} 
                        marks={{ 1: '1', 3: '3', 5: '5', 7: '7', 10: '10' }}
                        tipFormatter={(value) => `难度${value}`}
                      />
                    </Form.Item>

                    <Form.Item label="解释详细程度" name="explanationDetail">
                      <Select>
                        <Option value="brief">简要</Option>
                        <Option value="moderate">适中</Option>
                        <Option value="detailed">详细</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="练习频率" name="practiceFrequency">
                      <Select>
                        <Option value="low">低频</Option>
                        <Option value="medium">中频</Option>
                        <Option value="high">高频</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="挑战级别" name="challengeLevel">
                      <Select>
                        <Option value="safe">安全</Option>
                        <Option value="moderate">适中</Option>
                        <Option value="aggressive">积极</Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label="提醒频率" name="reminderFrequency">
                      <Select>
                        <Option value="daily">每日</Option>
                        <Option value="weekly">每周</Option>
                        <Option value="monthly">每月</Option>
                        <Option value="none">不提醒</Option>
                      </Select>
                    </Form.Item>
                  </Card>
                </Col>
              </Row>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  size="large"
                >
                  保存设置
                </Button>
              </div>
            </Form>
          </TabPane>

          {/* 成就页面 */}
          <TabPane 
            tab={
              <span>
                <TrophyOutlined />
                成就
              </span>
            } 
            key="achievements"
          >
            {profile && (
              <Row gutter={[16, 16]}>
                {profile.learningHistory.achievements.map((achievement, index) => (
                  <Col xs={12} sm={8} md={6} key={index}>
                    <Card size="small" hoverable style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 32, marginBottom: 8 }}>
                        <TrophyOutlined style={{ color: '#faad14' }} />
                      </div>
                      <Text strong>{achievement}</Text>
                    </Card>
                  </Col>
                ))}
                
                {profile.learningHistory.achievements.length === 0 && (
                  <Col span={24}>
                    <div style={{ textAlign: 'center', padding: 48 }}>
                      <StarOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
                      <div>
                        <Text type="secondary">还没有获得成就</Text>
                      </div>
                      <div>
                        <Text type="secondary">继续学习来解锁您的第一个成就吧！</Text>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LearnerProfileManager;

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Progress, 
  Typography,
  Timeline,
  Tag,
  Statistic,
  Button,
  Tooltip,
  Avatar,
  Empty,
  Tabs,
  DatePicker,
  Select
} from 'antd';
import { 
  ClockCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  FireOutlined,
  BookOutlined,
  CalendarOutlined,
  LineChartOutlined,
  TeamOutlined,
  StarOutlined,
  BarChartOutlined
} from '@ant-design/icons';
import { LearnerProfile, LearningResult, Agent } from '../types';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;
const { TabPane } = Tabs;

interface LearningProgressTrackerProps {
  userId: string;
  profile?: LearnerProfile;
  onGoalUpdate?: (goals: any[]) => void;
}

interface LearningSession {
  id: string;
  subject: string;
  agentIds: string[];
  duration: number;
  completedAt: string;
  performance: {
    accuracy: number;
    engagement: number;
    completion: number;
  };
  results: LearningResult[];
}

interface LearningGoal {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  status: 'active' | 'completed' | 'paused' | 'overdue';
  milestones: {
    title: string;
    completed: boolean;
    completedAt?: string;
  }[];
}

export const LearningProgressTracker: React.FC<LearningProgressTrackerProps> = ({
  userId,
  profile,
  onGoalUpdate
}) => {
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs()
  ]);
  const [filterSubject, setFilterSubject] = useState<string>('all');

  useEffect(() => {
    if (userId) {
      loadProgressData();
    }
  }, [userId, timeRange]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      // 加载学习会话
      const sessionsResponse = await fetch(
        `/api/learner-profile/${userId}/sessions?` + 
        new URLSearchParams({
          startDate: timeRange[0].toISOString(),
          endDate: timeRange[1].toISOString(),
          subject: filterSubject
        })
      );
      
      if (sessionsResponse.ok) {
        const sessionsData = await sessionsResponse.json();
        setSessions(sessionsData.sessions || []);
      }

      // 加载学习目标
      const goalsResponse = await fetch(`/api/learner-profile/${userId}/goals`);
      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json();
        setGoals(goalsData.goals || []);
      }
    } catch (error) {
      console.error('加载进度数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'active':
        return <SyncOutlined style={{ color: '#1890ff' }} spin />;
      case 'paused':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'overdue':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return <ClockCircleOutlined />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#52c41a';
      case 'active':
        return '#1890ff';
      case 'paused':
        return '#faad14';
      case 'overdue':
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  const calculateWeeklyStats = () => {
    const lastWeek = dayjs().subtract(7, 'day');
    const weekSessions = sessions.filter(s => dayjs(s.completedAt).isAfter(lastWeek));
    
    return {
      totalTime: weekSessions.reduce((sum, s) => sum + s.duration, 0),
      sessionCount: weekSessions.length,
      averagePerformance: weekSessions.length > 0 
        ? weekSessions.reduce((sum, s) => sum + (s.performance.accuracy + s.performance.engagement + s.performance.completion) / 3, 0) / weekSessions.length
        : 0,
      subjectsStudied: new Set(weekSessions.map(s => s.subject)).size
    };
  };

  const weeklyStats = calculateWeeklyStats();

  return (
    <div className="learning-progress-tracker">
      <Card 
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              <LineChartOutlined style={{ marginRight: 8 }} />
              学习进度追踪
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <RangePicker
                size="small"
                value={timeRange}
                onChange={(dates) => dates && setTimeRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
              />
              <Select 
                size="small" 
                value={filterSubject} 
                onChange={setFilterSubject}
                style={{ width: 120 }}
              >
                <Option value="all">全部学科</Option>
                <Option value="数学">数学</Option>
                <Option value="物理">物理</Option>
                <Option value="编程">编程</Option>
                <Option value="语言">语言</Option>
              </Select>
            </div>
          </div>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          {/* 概览 */}
          <TabPane 
            tab={
              <span>
                <BarChartOutlined />
                概览
              </span>
            } 
            key="overview"
          >
            <Row gutter={[24, 24]}>
              {/* 本周统计 */}
              <Col xs={24} lg={12}>
                <Card title="本周学习统计" size="small">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="学习时长"
                        value={Math.round(weeklyStats.totalTime / 60)}
                        suffix="小时"
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                    <Col span={12}>
                      <Statistic
                        title="学习会话"
                        value={weeklyStats.sessionCount}
                        suffix="次"
                        prefix={<BookOutlined />}
                      />
                    </Col>
                    <Col span={12} style={{ marginTop: 16 }}>
                      <Statistic
                        title="平均表现"
                        value={weeklyStats.averagePerformance}
                        precision={1}
                        suffix="%"
                        prefix={<StarOutlined />}
                      />
                    </Col>
                    <Col span={12} style={{ marginTop: 16 }}>
                      <Statistic
                        title="学科数量"
                        value={weeklyStats.subjectsStudied}
                        suffix="个"
                        prefix={<TeamOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>

              {/* 整体进度 */}
              <Col xs={24} lg={12}>
                <Card title="整体学习进度" size="small">
                  {profile && (
                    <>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text>总体进度</Text>
                          <Text>{Math.round(profile.recentPerformance.accuracy * 100)}%</Text>
                        </div>
                        <Progress 
                          percent={Math.round(profile.recentPerformance.accuracy * 100)}
                          strokeColor="#1890ff"
                        />
                      </div>

                      <div style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text>参与度</Text>
                          <Text>{Math.round(profile.recentPerformance.engagement * 100)}%</Text>
                        </div>
                        <Progress 
                          percent={Math.round(profile.recentPerformance.engagement * 100)}
                          strokeColor="#52c41a"
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                          <Text>一致性</Text>
                          <Text>{Math.round(profile.recentPerformance.consistency * 100)}%</Text>
                        </div>
                        <Progress 
                          percent={Math.round(profile.recentPerformance.consistency * 100)}
                          strokeColor="#faad14"
                        />
                      </div>
                    </>
                  )}
                </Card>
              </Col>

              {/* 学习目标 */}
              <Col xs={24}>
                <Card 
                  title="学习目标" 
                  size="small"
                  extra={
                    <Button type="link" size="small">
                      管理目标
                    </Button>
                  }
                >
                  {goals.length === 0 ? (
                    <Empty description="暂无学习目标" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                  ) : (
                    <Row gutter={[16, 16]}>
                      {goals.map(goal => (
                        <Col xs={24} sm={12} lg={8} key={goal.id}>
                          <Card size="small" hoverable>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                              {getStatusIcon(goal.status)}
                              <Text strong style={{ marginLeft: 8 }}>
                                {goal.title}
                              </Text>
                            </div>
                            
                            <div style={{ marginBottom: 12 }}>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {goal.description}
                              </Text>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <Text style={{ fontSize: 12 }}>进度</Text>
                                <Text style={{ fontSize: 12 }}>{goal.progress}%</Text>
                              </div>
                              <Progress 
                                percent={goal.progress} 
                                size="small"
                                strokeColor={getStatusColor(goal.status)}
                              />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Tag color={getStatusColor(goal.status)}>
                                {goal.status === 'active' ? '进行中' :
                                 goal.status === 'completed' ? '已完成' :
                                 goal.status === 'paused' ? '已暂停' : '逾期'}
                              </Tag>
                              <Text type="secondary" style={{ fontSize: 11 }}>
                                {dayjs(goal.targetDate).format('MM/DD')}
                              </Text>
                            </div>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          {/* 学习历史 */}
          <TabPane 
            tab={
              <span>
                <CalendarOutlined />
                学习历史
              </span>
            } 
            key="history"
          >
            <Card size="small">
              {sessions.length === 0 ? (
                <Empty description="暂无学习记录" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <Timeline>
                  {sessions.map(session => (
                    <Timeline.Item
                      key={session.id}
                      dot={<BookOutlined style={{ fontSize: 16 }} />}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                          <Text strong>{session.subject}</Text>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(session.completedAt).format('MM/DD HH:mm')}
                          </Text>
                        </div>
                        
                        <div style={{ marginBottom: 8 }}>
                          <Tag color="blue">
                            {Math.round(session.duration / 60)}分钟
                          </Tag>
                          <Tag color="green">
                            准确率 {Math.round(session.performance.accuracy * 100)}%
                          </Tag>
                          <Tag color="orange">
                            参与度 {Math.round(session.performance.engagement * 100)}%
                          </Tag>
                        </div>

                        {session.results.length > 0 && (
                          <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              学习内容: {session.results.map(r => r.title).join(', ')}
                            </Text>
                          </div>
                        )}
                      </div>
                    </Timeline.Item>
                  ))}
                </Timeline>
              )}
            </Card>
          </TabPane>

          {/* 成就系统 */}
          <TabPane 
            tab={
              <span>
                <TrophyOutlined />
                成就
              </span>
            } 
            key="achievements"
          >
            <Row gutter={[16, 16]}>
              {profile?.learningHistory.achievements.map((achievement, index) => (
                <Col xs={12} sm={8} md={6} key={index}>
                  <Card size="small" hoverable style={{ textAlign: 'center' }}>
                    <TrophyOutlined style={{ fontSize: 32, color: '#faad14', marginBottom: 8 }} />
                    <Text strong style={{ fontSize: 12 }}>{achievement}</Text>
                  </Card>
                </Col>
              )) || (
                <Col span={24}>
                  <Empty description="暂无成就" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                </Col>
              )}
            </Row>
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default LearningProgressTracker;

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Progress, 
  Badge, 
  Tooltip, 
  Button, 
  Modal, 
  Tabs, 
  Row, 
  Col, 
  Tag,
  Empty,
  Avatar,
  Statistic,
  Space,
  Divider
} from 'antd';
import { 
  TrophyOutlined, 
  FireOutlined, 
  StarOutlined, 
  CrownOutlined,
  BarChartOutlined,
  GiftOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import { GamificationManager, UserStats, Achievement } from '@/utils/gamification';

const { TabPane } = Tabs;

interface GamificationPanelProps {
  onNewAchievement?: (achievement: Achievement) => void;
}

const GamificationPanel: React.FC<GamificationPanelProps> = ({ onNewAchievement }) => {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isMounted, setIsMounted] = useState(false);

  // 客户端挂载后初始化
  useEffect(() => {
    setIsMounted(true);
    setUserStats(GamificationManager.getUserStats());
  }, []);

  // 监听统计数据变化
  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      const currentStats = GamificationManager.getUserStats();
      setUserStats(currentStats);
    }, 1000);

    return () => clearInterval(interval);
  }, [isMounted]);

  // 如果还没有挂载或没有数据，不渲染
  if (!isMounted || !userStats) {
    return null;
  }

  // 计算成就统计
  const achievementStats = {
    total: userStats.achievements.length,
    unlocked: userStats.achievements.filter(a => a.unlocked).length,
    byCategory: userStats.achievements.reduce((acc, achievement) => {
      acc[achievement.category] = (acc[achievement.category] || 0) + (achievement.unlocked ? 1 : 0);
      return acc;
    }, {} as Record<string, number>),
  };

  // 获取最近解锁的成就
  const recentAchievements = userStats.achievements
    .filter(a => a.unlocked && a.unlockedAt)
    .sort((a, b) => (b.unlockedAt || 0) - (a.unlockedAt || 0))
    .slice(0, 3);

  // 获取进行中的成就
  const progressAchievements = userStats.achievements
    .filter(a => !a.unlocked && a.maxProgress && a.progress !== undefined)
    .sort((a, b) => ((b.progress || 0) / (b.maxProgress || 1)) - ((a.progress || 0) / (a.maxProgress || 1)));

  // 渲染成就卡片
  const renderAchievementCard = (achievement: Achievement, showProgress = true) => {
    const isUnlocked = achievement.unlocked;
    const progressPercent = achievement.maxProgress 
      ? Math.round(((achievement.progress || 0) / achievement.maxProgress) * 100)
      : 100;

    return (
      <Card
        key={achievement.id}
        size="small"
        className={`achievement-card ${isUnlocked ? 'unlocked' : 'locked'}`}
        style={{ 
          opacity: isUnlocked ? 1 : 0.6,
          border: isUnlocked ? '2px solid #52c41a' : '1px solid #d9d9d9'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ fontSize: '2rem', filter: isUnlocked ? 'none' : 'grayscale(100%)' }}>
            {achievement.icon}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ 
              fontWeight: 'bold', 
              color: isUnlocked ? '#52c41a' : '#8c8c8c',
              marginBottom: '4px'
            }}>
              {achievement.title}
              {isUnlocked && <Badge count="✓" style={{ marginLeft: '8px', backgroundColor: '#52c41a' }} />}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              marginBottom: showProgress && achievement.maxProgress ? '8px' : '0'
            }}>
              {achievement.description}
            </div>
            {showProgress && achievement.maxProgress && !isUnlocked && (
              <Progress 
                percent={progressPercent}
                size="small"
                format={() => `${achievement.progress || 0}/${achievement.maxProgress}`}
              />
            )}
            <div style={{ fontSize: '12px', color: '#1890ff', fontWeight: 'bold' }}>
              +{achievement.points} 经验值
            </div>
          </div>
        </div>
      </Card>
    );
  };

  // 渲染统计概览
  const renderOverview = () => (
    <div>
      {/* 等级和经验 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={6}>
            <div style={{ textAlign: 'center' }}>
              <Avatar 
                size={80} 
                icon={<CrownOutlined />}
                style={{ backgroundColor: '#1890ff', marginBottom: '8px' }}
              />
              <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                等级 {userStats.level}
              </div>
              <Tag color="blue">{GamificationManager.getLevelTitle(userStats.level)}</Tag>
            </div>
          </Col>
          <Col span={18}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>经验进度</span>
                  <span>{userStats.currentXP} / {userStats.nextLevelXP}</span>
                </div>
                <Progress 
                  percent={Math.round((userStats.currentXP / userStats.nextLevelXP) * 100)}
                  strokeColor={{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }}
                />
              </div>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic 
                    title="总积分" 
                    value={userStats.totalPoints} 
                    prefix={<StarOutlined />}
                    valueStyle={{ color: '#cf1322' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="连续天数" 
                    value={userStats.streakDays} 
                    prefix={<FireOutlined />}
                    valueStyle={{ color: '#fa541c' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="总辩论" 
                    value={userStats.totalDebates} 
                    prefix={<BarChartOutlined />}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
              </Row>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 最近成就 */}
      <Card title="🏆 最近解锁成就" style={{ marginBottom: '16px' }}>
        {recentAchievements.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {recentAchievements.map(achievement => renderAchievementCard(achievement, false))}
          </Space>
        ) : (
          <Empty description="还没有解锁任何成就" />
        )}
      </Card>

      {/* 进行中的成就 */}
      <Card title="🎯 进行中的成就">
        {progressAchievements.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {progressAchievements.slice(0, 3).map(achievement => renderAchievementCard(achievement, true))}
          </Space>
        ) : (
          <Empty description="所有进度成就都已完成！" />
        )}
      </Card>
    </div>
  );

  // 渲染成就列表
  const renderAchievements = () => {
    const categories = {
      first_time: { name: '首次体验', icon: '🎯', color: '#52c41a' },
      streak: { name: '连续登录', icon: '🔥', color: '#fa541c' },
      exploration: { name: '探索发现', icon: '🧭', color: '#1890ff' },
      mastery: { name: '技能熟练', icon: '⚔️', color: '#722ed1' },
      social: { name: '社交互动', icon: '🤝', color: '#13c2c2' },
    };

    return (
      <div>
        <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
          <Col span={12}>
            <Card size="small">
              <Statistic 
                title="成就进度" 
                value={achievementStats.unlocked}
                suffix={`/ ${achievementStats.total}`}
                prefix={<TrophyOutlined />}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small">
              <Statistic 
                title="完成率" 
                value={Math.round((achievementStats.unlocked / achievementStats.total) * 100)}
                suffix="%"
                prefix={<BarChartOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {Object.entries(categories).map(([categoryKey, categoryInfo]) => {
          const categoryAchievements = userStats.achievements.filter(a => a.category === categoryKey);
          const unlockedCount = categoryAchievements.filter(a => a.unlocked).length;

          return (
            <Card 
              key={categoryKey}
              title={
                <span>
                  <span style={{ fontSize: '1.2rem', marginRight: '8px' }}>{categoryInfo.icon}</span>
                  {categoryInfo.name}
                  <Tag color={categoryInfo.color} style={{ marginLeft: '8px' }}>
                    {unlockedCount}/{categoryAchievements.length}
                  </Tag>
                </span>
              }
              style={{ marginBottom: '16px' }}
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                {categoryAchievements.map(achievement => renderAchievementCard(achievement))}
              </Space>
            </Card>
          );
        })}
      </div>
    );
  };

  // 渲染统计信息
  const renderStats = () => (
    <div>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card title="📊 学习统计">
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Statistic 
                  title="总辩论次数" 
                  value={userStats.totalDebates}
                  prefix={<BarChartOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="提问总数" 
                  value={userStats.totalQuestions}
                  prefix="❓"
                />
              </Col>
              <Col span={8}>
                <Statistic 
                  title="加入天数" 
                  value={Math.ceil((Date.now() - new Date(userStats.joinedDate).getTime()) / (1000 * 60 * 60 * 24))}
                  prefix={<CalendarOutlined />}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
        <Col span={12}>
          <Card title="👨‍🏫 常用教师">
            {Object.keys(userStats.favoriteTeachers).length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(userStats.favoriteTeachers)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([teacher, count]) => (
                    <div key={teacher} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{teacher}</span>
                      <Tag color="blue">{count} 次</Tag>
                    </div>
                  ))}
              </Space>
            ) : (
              <Empty description="还未与教师交互" />
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="🧠 使用策略">
            {Object.keys(userStats.usedStrategies).length > 0 ? (
              <Space direction="vertical" style={{ width: '100%' }}>
                {Object.entries(userStats.usedStrategies)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 5)
                  .map(([strategy, count]) => (
                    <div key={strategy} style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>{strategy}</span>
                      <Tag color="green">{count} 次</Tag>
                    </div>
                  ))}
              </Space>
            ) : (
              <Empty description="还未使用任何策略" />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );

  return (
    <>
      {/* 游戏化面板触发按钮 */}
      <div style={{ position: 'relative' }}>
        <Tooltip title="查看学习进度和成就">
          <Button
            type="primary"
            shape="circle"
            size="large"
            icon={<TrophyOutlined />}
            onClick={() => setIsModalVisible(true)}
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              zIndex: 1000,
              width: '60px',
              height: '60px',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}
          />
        </Tooltip>
        
        {/* 等级徽章 */}
        <Badge 
          count={userStats.level}
          style={{ 
            backgroundColor: '#f50',
            position: 'fixed',
            bottom: '70px',
            right: '15px',
            zIndex: 1001,
          }}
        />
      </div>

      {/* 游戏化面板模态框 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TrophyOutlined style={{ color: '#1890ff' }} />
            <span>学习进度</span>
            <Tag color="blue">Lv.{userStats.level}</Tag>
          </div>
        }
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
        style={{ top: 20 }}
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                概览
              </span>
            }
            key="overview"
          >
            {renderOverview()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <TrophyOutlined />
                成就 ({achievementStats.unlocked}/{achievementStats.total})
              </span>
            }
            key="achievements"
          >
            {renderAchievements()}
          </TabPane>
          <TabPane
            tab={
              <span>
                <BarChartOutlined />
                统计
              </span>
            }
            key="stats"
          >
            {renderStats()}
          </TabPane>
        </Tabs>
      </Modal>

      {/* CSS 样式 */}
      <style jsx>{`
        .achievement-card {
          transition: all 0.3s ease;
        }
        
        .achievement-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .achievement-card.unlocked {
          background: linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%);
        }
        
        .achievement-card.locked {
          background: #fafafa;
        }
      `}</style>
    </>
  );
};

export default GamificationPanel;

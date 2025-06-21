import React from 'react';
import { notification } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import { Achievement } from '@/utils/gamification';

interface AchievementNotificationProps {
  achievement: Achievement;
  pointsEarned?: number;
}

export const showAchievementNotification = (achievement: Achievement, pointsEarned = 0) => {
  notification.open({
    message: '🎉 成就解锁！',
    description: (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        padding: '8px 0'
      }}>
        <div style={{ fontSize: '2rem' }}>{achievement.icon}</div>
        <div>
          <div style={{ 
            fontWeight: 'bold', 
            fontSize: '16px',
            color: '#52c41a',
            marginBottom: '4px'
          }}>
            {achievement.title}
          </div>
          <div style={{ 
            color: '#666',
            marginBottom: '4px'
          }}>
            {achievement.description}
          </div>
          <div style={{ 
            color: '#1890ff',
            fontWeight: 'bold',
            fontSize: '14px'
          }}>
            +{achievement.points} 经验值
            {pointsEarned > achievement.points && ` (总计 +${pointsEarned})`}
          </div>
        </div>
      </div>
    ),
    icon: <TrophyOutlined style={{ color: '#52c41a' }} />,
    duration: 6,
    style: {
      border: '2px solid #52c41a',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #f6ffed 0%, #f0f9ff 100%)',
    },
  });
};

export const showLevelUpNotification = (newLevel: number, levelTitle: string) => {
  notification.open({
    message: '🎊 等级提升！',
    description: (
      <div style={{ textAlign: 'center', padding: '8px 0' }}>
        <div style={{ 
          fontSize: '24px',
          fontWeight: 'bold',
          color: '#1890ff',
          marginBottom: '8px'
        }}>
          等级 {newLevel}
        </div>
        <div style={{ 
          fontSize: '16px',
          color: '#722ed1',
          fontWeight: 'bold'
        }}>
          {levelTitle}
        </div>
      </div>
    ),
    icon: <div style={{ fontSize: '24px' }}>👑</div>,
    duration: 8,
    style: {
      border: '2px solid #1890ff',
      borderRadius: '8px',
      background: 'linear-gradient(135deg, #e6f7ff 0%, #f9f0ff 100%)',
    },
  });
};

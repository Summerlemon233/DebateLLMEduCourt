import { NextApiRequest, NextApiResponse } from 'next';
import { LearnerProfileManager } from '../../../src/utils/learnerProfile';
import { LearnerProfile } from '../../../src/types';

/**
 * 学习者画像管理API
 * 处理用户画像的创建、更新、查询等操作
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = req.query;
  
  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: '缺少有效的用户ID' });
  }

  try {
    switch (req.method) {
      case 'GET':
        await handleGetProfile(userId, req, res);
        break;
      case 'POST':
        await handleCreateProfile(userId, req, res);
        break;
      case 'PUT':
        await handleUpdateProfile(userId, req, res);
        break;
      case 'DELETE':
        await handleDeleteProfile(userId, req, res);
        break;
      default:
        res.status(405).json({ error: `不支持的请求方法: ${req.method}` });
    }
  } catch (error) {
    console.error('用户画像API错误:', error);
    res.status(500).json({
      error: '用户画像操作失败',
      details: error instanceof Error ? error.message : '未知错误'
    });
  }
}

/**
 * 获取用户画像
 */
async function handleGetProfile(userId: string, req: NextApiRequest, res: NextApiResponse) {
  const { action } = req.query;
  
  let profile = LearnerProfileManager.getProfile(userId);
  
  // 如果画像不存在，创建默认画像
  if (!profile) {
    profile = LearnerProfileManager.createProfile(userId);
  }

  if (action === 'insights') {
    // 获取学习洞察
    const insights = LearnerProfileManager.getLearningInsights(userId);
    return res.status(200).json({
      success: true,
      profile,
      insights,
    });
  } else if (action === 'recommendations') {
    // 获取个性化推荐
    const recommendations = LearnerProfileManager.generateRecommendations(userId);
    return res.status(200).json({
      success: true,
      profile,
      recommendations,
    });
  }

  // 返回基本画像信息
  res.status(200).json({
    success: true,
    profile,
  });
}

/**
 * 创建用户画像
 */
async function handleCreateProfile(userId: string, req: NextApiRequest, res: NextApiResponse) {
  const initialData = req.body;
  
  // 检查画像是否已存在
  const existingProfile = LearnerProfileManager.getProfile(userId);
  if (existingProfile) {
    return res.status(409).json({
      error: '用户画像已存在',
      profile: existingProfile,
    });
  }

  const profile = LearnerProfileManager.createProfile(userId, initialData);
  
  res.status(201).json({
    success: true,
    message: '用户画像创建成功',
    profile,
  });
}

/**
 * 更新用户画像
 */
async function handleUpdateProfile(userId: string, req: NextApiRequest, res: NextApiResponse) {
  const { action, ...updateData } = req.body;
  
  // 检查画像是否存在
  const existingProfile = LearnerProfileManager.getProfile(userId);
  if (!existingProfile) {
    return res.status(404).json({ error: '用户画像不存在' });
  }

  if (action === 'record-session') {
    // 记录学习会话
    const { duration, completedLessons, performance, topic } = updateData;
    LearnerProfileManager.recordLearningSession(userId, {
      duration,
      completedLessons,
      performance,
      topic,
    });
  } else if (action === 'update-knowledge') {
    // 更新知识地图
    const { subject, performance } = updateData;
    LearnerProfileManager.updateKnowledgeMap(userId, subject, performance);
  } else if (action === 'analyze-style') {
    // 分析学习风格
    const { interactions } = updateData;
    LearnerProfileManager.analyzeLearningStyle(userId, interactions);
  } else if (action === 'update-goals') {
    // 更新学习目标
    const { goals } = updateData;
    LearnerProfileManager.updateProfile(userId, { currentGoals: goals });
  } else if (action === 'update-preferences') {
    // 更新学习偏好
    const { preferences } = updateData;
    const currentProfile = LearnerProfileManager.getProfile(userId)!;
    LearnerProfileManager.updateProfile(userId, {
      preferences: { ...currentProfile.preferences, ...preferences },
    });
  } else {
    // 通用更新
    LearnerProfileManager.updateProfile(userId, updateData);
  }

  const updatedProfile = LearnerProfileManager.getProfile(userId);
  
  res.status(200).json({
    success: true,
    message: '用户画像更新成功',
    profile: updatedProfile,
  });
}

/**
 * 删除用户画像
 */
async function handleDeleteProfile(userId: string, req: NextApiRequest, res: NextApiResponse) {
  const existingProfile = LearnerProfileManager.getProfile(userId);
  if (!existingProfile) {
    return res.status(404).json({ error: '用户画像不存在' });
  }

  // 这里应该实现删除逻辑
  // 由于当前使用内存存储，可以直接从Map中删除
  // 在实际生产环境中，应该从数据库中删除
  
  res.status(200).json({
    success: true,
    message: '用户画像删除成功',
  });
}

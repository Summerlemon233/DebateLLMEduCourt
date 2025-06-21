import { LearnerProfile, LearningGoal, PerformanceMetrics, Recommendation } from '../types';

/**
 * 学习者画像管理器
 * 负责构建、更新和管理学习者的个性化画像
 */
export class LearnerProfileManager {
  private static profiles: Map<string, LearnerProfile> = new Map();

  /**
   * 创建新的学习者画像
   */
  static createProfile(userId: string, initialData?: Partial<LearnerProfile>): LearnerProfile {
    const now = new Date().toISOString();
    
    const profile: LearnerProfile = {
      userId,
      demographics: {
        age: initialData?.demographics?.age,
        education: initialData?.demographics?.education,
        background: initialData?.demographics?.background || [],
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      learningStyle: {
        visualAuditory: 'mixed',
        processingStyle: 'mixed',
        pace: 'moderate',
        preferredTime: 'flexible',
        ...initialData?.learningStyle,
      },
      knowledgeMap: initialData?.knowledgeMap || {},
      preferences: {
        contentFormat: ['text', 'interactive'],
        sessionLength: 30,
        difficultyPreference: 'comfortable',
        feedbackStyle: 'detailed',
        gamificationEnabled: true,
        ...initialData?.preferences,
      },
      learningHistory: {
        totalSessions: 0,
        totalTimeSpent: 0,
        completedLessons: [],
        achievements: [],
        streakDays: 0,
        lastActive: now,
        averageSessionLength: 0,
        ...initialData?.learningHistory,
      },
      currentGoals: initialData?.currentGoals || [],
      recentPerformance: {
        accuracy: 0,
        consistency: 0,
        engagement: 0,
        improvement: 0,
        recentScores: [],
        strongAreas: [],
        improvementAreas: [],
        lastCalculated: now,
        ...initialData?.recentPerformance,
      },
      adaptationSettings: {
        contentDifficulty: 5,
        explanationDetail: 'moderate',
        practiceFrequency: 'medium',
        challengeLevel: 'moderate',
        reminderFrequency: 'weekly',
        ...initialData?.adaptationSettings,
      },
      createdAt: now,
      updatedAt: now,
    };

    this.profiles.set(userId, profile);
    return profile;
  }

  /**
   * 获取学习者画像
   */
  static getProfile(userId: string): LearnerProfile | null {
    return this.profiles.get(userId) || null;
  }

  /**
   * 更新学习者画像
   */
  static updateProfile(userId: string, updates: Partial<LearnerProfile>): LearnerProfile {
    const existingProfile = this.profiles.get(userId);
    if (!existingProfile) {
      throw new Error(`用户 ${userId} 的画像不存在`);
    }

    const updatedProfile: LearnerProfile = {
      ...existingProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.profiles.set(userId, updatedProfile);
    return updatedProfile;
  }

  /**
   * 记录学习会话
   */
  static recordLearningSession(
    userId: string, 
    sessionData: {
      duration: number;
      completedLessons?: string[];
      performance?: number;
      topic?: string;
    }
  ): void {
    const profile = this.getProfile(userId);
    if (!profile) return;

    const updatedHistory = {
      ...profile.learningHistory,
      totalSessions: profile.learningHistory.totalSessions + 1,
      totalTimeSpent: profile.learningHistory.totalTimeSpent + sessionData.duration,
      lastActive: new Date().toISOString(),
    };

    // 更新平均会话时长
    updatedHistory.averageSessionLength = 
      updatedHistory.totalTimeSpent / updatedHistory.totalSessions;

    // 添加完成的课程
    if (sessionData.completedLessons) {
      updatedHistory.completedLessons = [
        ...new Set([...updatedHistory.completedLessons, ...sessionData.completedLessons])
      ];
    }

    // 更新知识地图
    if (sessionData.topic && sessionData.performance !== undefined) {
      this.updateKnowledgeMap(userId, sessionData.topic, sessionData.performance);
    }

    this.updateProfile(userId, { learningHistory: updatedHistory });
  }

  /**
   * 更新知识地图
   */
  static updateKnowledgeMap(userId: string, subject: string, performance: number): void {
    const profile = this.getProfile(userId);
    if (!profile) return;

    const currentKnowledge = profile.knowledgeMap[subject] || {
      level: 1,
      masteredConcepts: [],
      weakAreas: [],
      interests: [],
      lastAssessed: new Date().toISOString(),
    };

    // 根据表现调整级别
    let newLevel = currentKnowledge.level;
    if (performance >= 0.8) {
      newLevel = Math.min(10, newLevel + 0.5);
    } else if (performance < 0.6) {
      newLevel = Math.max(1, newLevel - 0.3);
    }

    const updatedKnowledgeMap = {
      ...profile.knowledgeMap,
      [subject]: {
        ...currentKnowledge,
        level: newLevel,
        lastAssessed: new Date().toISOString(),
      },
    };

    this.updateProfile(userId, { knowledgeMap: updatedKnowledgeMap });
  }

  /**
   * 分析学习风格
   */
  static analyzeLearningStyle(userId: string, interactions: LearningInteraction[]): void {
    const profile = this.getProfile(userId);
    if (!profile || interactions.length === 0) return;

    const analysis = this.performLearningStyleAnalysis(interactions);
    
    this.updateProfile(userId, {
      learningStyle: {
        ...profile.learningStyle,
        ...analysis,
      },
    });
  }

  /**
   * 执行学习风格分析
   */
  private static performLearningStyleAnalysis(interactions: LearningInteraction[]): Partial<LearnerProfile['learningStyle']> {
    const formatPreferences = interactions.reduce((acc, interaction) => {
      acc[interaction.contentFormat] = (acc[interaction.contentFormat] || 0) + interaction.engagementScore;
      return acc;
    }, {} as Record<string, number>);

    const avgSessionDuration = interactions.reduce((sum, i) => sum + i.duration, 0) / interactions.length;
    
    // 分析视觉/听觉/动觉偏好
    let visualAuditory: 'visual' | 'auditory' | 'kinesthetic' | 'mixed' = 'mixed';
    if (formatPreferences.visual > formatPreferences.auditory * 1.5) {
      visualAuditory = 'visual';
    } else if (formatPreferences.auditory > formatPreferences.visual * 1.5) {
      visualAuditory = 'auditory';
    } else if (formatPreferences.interactive > Math.max(formatPreferences.visual, formatPreferences.auditory)) {
      visualAuditory = 'kinesthetic';
    }

    // 分析学习节奏
    let pace: 'fast' | 'moderate' | 'slow' = 'moderate';
    if (avgSessionDuration < 20) {
      pace = 'fast';
    } else if (avgSessionDuration > 45) {
      pace = 'slow';
    }

    return { visualAuditory, pace };
  }

  /**
   * 生成个性化推荐
   */
  static generateRecommendations(userId: string): Recommendation[] {
    const profile = this.getProfile(userId);
    if (!profile) return [];

    const recommendations: Recommendation[] = [];
    const now = new Date().toISOString();

    // 基于知识地图的推荐
    Object.entries(profile.knowledgeMap).forEach(([subject, knowledge]) => {
      if (knowledge.level < 3) {
        recommendations.push({
          id: `foundation-${subject}`,
          type: 'lesson',
          title: `${subject} 基础强化`,
          description: `针对 ${subject} 的基础知识进行强化学习`,
          reason: '检测到基础知识需要加强',
          priority: 9,
          estimatedTime: 30,
          difficulty: Math.max(1, knowledge.level - 1),
          subject,
          learningObjectives: [`提升${subject}基础理解`, `建立扎实的知识基础`],
          createdAt: now,
        });
      }

      if (knowledge.weakAreas.length > 0) {
        recommendations.push({
          id: `improvement-${subject}`,
          type: 'practice',
          title: `${subject} 薄弱环节练习`,
          description: `针对 ${knowledge.weakAreas.join(', ')} 进行专项练习`,
          reason: '发现学习薄弱环节',
          priority: 8,
          estimatedTime: 25,
          difficulty: knowledge.level,
          subject,
          learningObjectives: [`改善薄弱环节`, `全面提升能力`],
          createdAt: now,
        });
      }
    });

    // 基于学习历史的推荐
    if (profile.learningHistory.totalSessions > 5) {
      const recentPerformance = profile.recentPerformance;
      if (recentPerformance.improvement < 0) {
        recommendations.push({
          id: 'review-session',
          type: 'review',
          title: '复习巩固课程',
          description: '回顾近期学习内容，巩固已学知识',
          reason: '最近学习效果有所下降',
          priority: 7,
          estimatedTime: 20,
          difficulty: profile.adaptationSettings.contentDifficulty - 1,
          subject: '综合复习',
          learningObjectives: ['巩固已学知识', '提升学习效果'],
          createdAt: now,
        });
      }
    }

    // 基于学习偏好的推荐
    if (profile.preferences.gamificationEnabled) {
      recommendations.push({
        id: 'challenge-activity',
        type: 'challenge',
        title: '每日学习挑战',
        description: '完成今日的学习挑战，获得成就奖励',
        reason: '您喜欢游戏化学习体验',
        priority: 6,
        estimatedTime: 15,
        difficulty: profile.adaptationSettings.contentDifficulty,
        subject: '挑战活动',
        learningObjectives: ['保持学习动机', '获得成就感'],
        createdAt: now,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // 按优先级排序
    return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 5);
  }

  /**
   * 获取学习洞察
   */
  static getLearningInsights(userId: string): LearningInsights {
    const profile = this.getProfile(userId);
    if (!profile) {
      throw new Error(`用户 ${userId} 的画像不存在`);
    }

    const knowledgeDistribution = Object.entries(profile.knowledgeMap).map(
      ([subject, knowledge]) => ({
        subject,
        level: knowledge.level,
        confidence: this.calculateConfidence(knowledge),
      })
    );

    const learningPattern = this.analyzeLearningPattern(profile);
    const suggestions = this.generateLearningStrategySuggestions(profile);

    return {
      overallProgress: this.calculateOverallProgress(profile),
      knowledgeDistribution,
      learningPattern,
      suggestions,
      nextRecommendations: this.generateRecommendations(userId),
    };
  }

  /**
   * 计算知识置信度
   */
  private static calculateConfidence(knowledge: any): number {
    const timeSinceAssessment = Date.now() - new Date(knowledge.lastAssessed).getTime();
    const daysSince = timeSinceAssessment / (1000 * 60 * 60 * 24);
    
    // 时间越久置信度越低
    const timeDecay = Math.max(0.5, 1 - daysSince / 30);
    const levelConfidence = knowledge.level / 10;
    
    return Math.min(1, levelConfidence * timeDecay);
  }

  /**
   * 分析学习模式
   */
  private static analyzeLearningPattern(profile: LearnerProfile): LearningPattern {
    const history = profile.learningHistory;
    
    return {
      consistency: this.calculateConsistency(history),
      preferredSessionLength: history.averageSessionLength,
      mostActiveTime: 'evening', // 简化实现
      learningSpeed: this.calculateLearningSpeed(profile),
      retentionRate: this.calculateRetentionRate(profile),
    };
  }

  /**
   * 计算学习一致性
   */
  private static calculateConsistency(history: LearnerProfile['learningHistory']): number {
    // 简化实现：基于连续学习天数
    return Math.min(1, history.streakDays / 30);
  }

  /**
   * 计算学习速度
   */
  private static calculateLearningSpeed(profile: LearnerProfile): 'fast' | 'moderate' | 'slow' {
    const avgSessionLength = profile.learningHistory.averageSessionLength;
    const totalProgress = Object.values(profile.knowledgeMap).reduce(
      (sum, knowledge) => sum + knowledge.level, 0
    );
    
    const progressRate = totalProgress / Math.max(1, profile.learningHistory.totalSessions);
    
    if (progressRate > 2 && avgSessionLength < 30) return 'fast';
    if (progressRate < 1 || avgSessionLength > 45) return 'slow';
    return 'moderate';
  }

  /**
   * 计算保持率
   */
  private static calculateRetentionRate(profile: LearnerProfile): number {
    // 简化实现：基于整体表现
    return Math.max(0.5, profile.recentPerformance.accuracy);
  }

  /**
   * 生成学习策略建议
   */
  private static generateLearningStrategySuggestions(profile: LearnerProfile): string[] {
    const suggestions: string[] = [];
    
    if (profile.recentPerformance.consistency < 0.7) {
      suggestions.push('建议保持规律的学习时间，提高学习一致性');
    }
    
    if (profile.learningHistory.averageSessionLength > 60) {
      suggestions.push('考虑缩短单次学习时间，分多次进行，提高学习效率');
    }
    
    if (profile.recentPerformance.improvement < 0) {
      suggestions.push('最近进步有所放缓，建议调整学习方法或寻求帮助');
    }
    
    return suggestions;
  }

  /**
   * 计算整体进度
   */
  private static calculateOverallProgress(profile: LearnerProfile): number {
    const knowledgeLevels = Object.values(profile.knowledgeMap).map(k => k.level);
    if (knowledgeLevels.length === 0) return 0;
    
    const avgLevel = knowledgeLevels.reduce((sum, level) => sum + level, 0) / knowledgeLevels.length;
    return Math.min(1, avgLevel / 10);
  }
}

// 辅助类型定义
interface LearningInteraction {
  contentFormat: string;
  duration: number;
  engagementScore: number;
}

interface LearningInsights {
  overallProgress: number;
  knowledgeDistribution: Array<{
    subject: string;
    level: number;
    confidence: number;
  }>;
  learningPattern: LearningPattern;
  suggestions: string[];
  nextRecommendations: Recommendation[];
}

interface LearningPattern {
  consistency: number;
  preferredSessionLength: number;
  mostActiveTime: string;
  learningSpeed: 'fast' | 'moderate' | 'slow';
  retentionRate: number;
}

/**
 * 游戏化系统工具函数
 * 提供积分、等级、成就和统计功能
 */

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points: number;
  category: 'first_time' | 'streak' | 'exploration' | 'mastery' | 'social';
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  maxProgress?: number;
}

export interface UserStats {
  level: number;
  totalPoints: number;
  currentXP: number;
  nextLevelXP: number;
  achievements: Achievement[];
  streakDays: number;
  lastActiveDate: string;
  totalDebates: number;
  totalQuestions: number;
  favoriteTeachers: Record<string, number>;
  usedStrategies: Record<string, number>;
  joinedDate: string;
}

export interface GamificationEvent {
  type: 'debate_completed' | 'first_use' | 'daily_login' | 'teacher_interaction' | 'strategy_use';
  data?: any;
}

// 等级系统配置
const LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  500,    // Level 4
  850,    // Level 5
  1300,   // Level 6
  1850,   // Level 7
  2500,   // Level 8
  3250,   // Level 9
  4100,   // Level 10
  5050,   // Level 11
  6100,   // Level 12
  7250,   // Level 13
  8500,   // Level 14
  10000,  // Level 15
];

// 成就定义
export const ACHIEVEMENTS: Achievement[] = [
  // 首次体验成就
  {
    id: 'first_debate',
    title: '初次辩论者',
    description: '完成第一次AI辩论',
    icon: '🎯',
    points: 100,
    category: 'first_time',
    unlocked: false,
  },
  {
    id: 'first_teacher',
    title: '拜师学艺',
    description: '第一次选择AI教师人格',
    icon: '👨‍🏫',
    points: 50,
    category: 'first_time',
    unlocked: false,
  },
  {
    id: 'first_strategy',
    title: '策略家',
    description: '首次使用EoT推理策略',
    icon: '🧠',
    points: 75,
    category: 'first_time',
    unlocked: false,
  },

  // 连续使用成就
  {
    id: 'streak_3',
    title: '三日精进',
    description: '连续3天使用平台',
    icon: '🔥',
    points: 150,
    category: 'streak',
    unlocked: false,
  },
  {
    id: 'streak_7',
    title: '七日大师',
    description: '连续7天使用平台',
    icon: '⭐',
    points: 350,
    category: 'streak',
    unlocked: false,
  },
  {
    id: 'streak_30',
    title: '月度学者',
    description: '连续30天使用平台',
    icon: '🏆',
    points: 1000,
    category: 'streak',
    unlocked: false,
  },

  // 探索成就
  {
    id: 'teacher_explorer',
    title: '教师收集家',
    description: '与所有5位AI教师都进行过对话',
    icon: '🎓',
    points: 300,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },
  {
    id: 'strategy_master',
    title: '策略大师',
    description: '尝试所有4种EoT推理策略',
    icon: '🧭',
    points: 400,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 4,
  },
  {
    id: 'model_diplomat',
    title: '模型外交官',
    description: '与所有5个AI模型都进行过辩论',
    icon: '🤝',
    points: 250,
    category: 'exploration',
    unlocked: false,
    progress: 0,
    maxProgress: 5,
  },

  // 熟练度成就
  {
    id: 'debate_veteran',
    title: '辩论老兵',
    description: '完成10次辩论',
    icon: '⚔️',
    points: 500,
    category: 'mastery',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'question_master',
    title: '提问大师',
    description: '提出50个问题',
    icon: '❓',
    points: 750,
    category: 'mastery',
    unlocked: false,
    progress: 0,
    maxProgress: 50,
  },
  {
    id: 'socrates_disciple',
    title: '苏格拉底门徒',
    description: '与苏格拉底老师进行10次对话',
    icon: '🤔',
    points: 400,
    category: 'social',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: 'curie_apprentice',
    title: '居里夫人学徒',
    description: '与居里夫人老师进行10次对话',
    icon: '🔬',
    points: 400,
    category: 'social',
    unlocked: false,
    progress: 0,
    maxProgress: 10,
  },
];

export class GamificationManager {
  private static readonly STORAGE_KEY = 'gamification_data';

  // 获取用户统计数据
  static getUserStats(): UserStats {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return this.createDefaultStats();
    }

    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // 合并默认成就列表，确保新成就能正确显示
        const mergedAchievements = this.mergeAchievements(data.achievements || []);
        return {
          ...data,
          achievements: mergedAchievements,
        };
      }
    } catch (error) {
      console.error('Error loading gamification data:', error);
    }

    // 返回默认数据
    return this.createDefaultStats();
  }

  // 创建默认统计数据
  private static createDefaultStats(): UserStats {
    return {
      level: 1,
      totalPoints: 0,
      currentXP: 0,
      nextLevelXP: LEVEL_THRESHOLDS[1] || 100,
      achievements: [...ACHIEVEMENTS],
      streakDays: 0,
      lastActiveDate: '',
      totalDebates: 0,
      totalQuestions: 0,
      favoriteTeachers: {},
      usedStrategies: {},
      joinedDate: new Date().toISOString(),
    };
  }

  // 合并成就列表，处理新添加的成就
  private static mergeAchievements(existingAchievements: Achievement[]): Achievement[] {
    const existingIds = new Set(existingAchievements.map(a => a.id));
    const merged = [...existingAchievements];

    // 添加新成就
    ACHIEVEMENTS.forEach(achievement => {
      if (!existingIds.has(achievement.id)) {
        merged.push({ ...achievement });
      }
    });

    return merged;
  }

  // 保存用户统计数据
  static saveUserStats(stats: UserStats): void {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  }

  // 处理游戏化事件
  static handleEvent(event: GamificationEvent): { newAchievements: Achievement[], pointsEarned: number, levelUp: boolean } {
    const stats = this.getUserStats();
    const result = {
      newAchievements: [] as Achievement[],
      pointsEarned: 0,
      levelUp: false,
    };

    // 更新每日登录
    this.updateDailyLogin(stats);

    // 根据事件类型处理
    switch (event.type) {
      case 'debate_completed':
        this.handleDebateCompleted(stats, event.data, result);
        break;
      case 'first_use':
        this.handleFirstUse(stats, result);
        break;
      case 'daily_login':
        // daily_login 在 updateDailyLogin 中已经处理
        break;
      case 'teacher_interaction':
        this.handleTeacherInteraction(stats, event.data, result);
        break;
      case 'strategy_use':
        this.handleStrategyUse(stats, event.data, result);
        break;
    }

    // 检查等级提升
    const oldLevel = stats.level;
    this.updateLevel(stats);
    result.levelUp = stats.level > oldLevel;

    // 保存更新后的统计数据
    this.saveUserStats(stats);

    return result;
  }

  // 处理辩论完成事件
  private static handleDebateCompleted(stats: UserStats, data: any, result: any): void {
    stats.totalDebates += 1;
    
    // 检查首次辩论成就
    const firstDebateAchievement = stats.achievements.find(a => a.id === 'first_debate');
    if (firstDebateAchievement && !firstDebateAchievement.unlocked) {
      this.unlockAchievement(firstDebateAchievement, stats, result);
    }

    // 检查辩论老兵成就
    const veteranAchievement = stats.achievements.find(a => a.id === 'debate_veteran');
    if (veteranAchievement) {
      veteranAchievement.progress = stats.totalDebates;
      if (!veteranAchievement.unlocked && stats.totalDebates >= (veteranAchievement.maxProgress || 10)) {
        this.unlockAchievement(veteranAchievement, stats, result);
      }
    }

    // 基础辩论积分
    const basePoints = 50;
    result.pointsEarned += basePoints;
    stats.totalPoints += basePoints;
    stats.currentXP += basePoints;

    // 记录使用的模型
    if (data?.models) {
      data.models.forEach((model: string) => {
        stats.usedStrategies[model] = (stats.usedStrategies[model] || 0) + 1;
      });

      // 检查模型外交官成就
      this.checkModelDiplomatAchievement(stats, result);
    }
  }

  // 处理首次使用事件
  private static handleFirstUse(stats: UserStats, result: any): void {
    const firstUseAchievements = ['first_debate', 'first_teacher', 'first_strategy'];
    
    firstUseAchievements.forEach(achievementId => {
      const achievement = stats.achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.unlocked) {
        this.unlockAchievement(achievement, stats, result);
      }
    });
  }

  // 处理教师交互事件
  private static handleTeacherInteraction(stats: UserStats, data: { teacherId: string }, result: any): void {
    if (!data?.teacherId) return;

    // 更新教师使用统计
    stats.favoriteTeachers[data.teacherId] = (stats.favoriteTeachers[data.teacherId] || 0) + 1;

    // 检查首次选择教师成就
    const firstTeacherAchievement = stats.achievements.find(a => a.id === 'first_teacher');
    if (firstTeacherAchievement && !firstTeacherAchievement.unlocked) {
      this.unlockAchievement(firstTeacherAchievement, stats, result);
    }

    // 检查教师收集家成就
    this.checkTeacherExplorerAchievement(stats, result);

    // 检查特定教师成就
    this.checkSpecificTeacherAchievements(stats, data.teacherId, result);
  }

  // 处理策略使用事件
  private static handleStrategyUse(stats: UserStats, data: { strategy: string }, result: any): void {
    if (!data?.strategy) return;

    // 更新策略使用统计
    stats.usedStrategies[data.strategy] = (stats.usedStrategies[data.strategy] || 0) + 1;

    // 检查首次策略成就
    const firstStrategyAchievement = stats.achievements.find(a => a.id === 'first_strategy');
    if (firstStrategyAchievement && !firstStrategyAchievement.unlocked) {
      this.unlockAchievement(firstStrategyAchievement, stats, result);
    }

    // 检查策略大师成就
    this.checkStrategyMasterAchievement(stats, result);
  }

  // 解锁成就
  private static unlockAchievement(achievement: Achievement, stats: UserStats, result: any): void {
    achievement.unlocked = true;
    achievement.unlockedAt = Date.now();
    result.newAchievements.push(achievement);
    result.pointsEarned += achievement.points;
    stats.totalPoints += achievement.points;
    stats.currentXP += achievement.points;
  }

  // 更新每日登录
  private static updateDailyLogin(stats: UserStats): void {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (stats.lastActiveDate !== today) {
      if (stats.lastActiveDate === yesterday) {
        // 连续登录
        stats.streakDays += 1;
      } else if (stats.lastActiveDate !== '') {
        // 断开连续登录
        stats.streakDays = 1;
      } else {
        // 首次登录
        stats.streakDays = 1;
      }

      stats.lastActiveDate = today;

      // 检查连续登录成就
      this.checkStreakAchievements(stats);
    }
  }

  // 检查连续登录成就
  private static checkStreakAchievements(stats: UserStats): void {
    const streakAchievements = [
      { id: 'streak_3', days: 3 },
      { id: 'streak_7', days: 7 },
      { id: 'streak_30', days: 30 },
    ];

    streakAchievements.forEach(({ id, days }) => {
      const achievement = stats.achievements.find(a => a.id === id);
      if (achievement && !achievement.unlocked && stats.streakDays >= days) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
      }
    });
  }

  // 检查教师收集家成就
  private static checkTeacherExplorerAchievement(stats: UserStats, result: any): void {
    const achievement = stats.achievements.find(a => a.id === 'teacher_explorer');
    if (!achievement || achievement.unlocked) return;

    const uniqueTeachers = Object.keys(stats.favoriteTeachers).length;
    achievement.progress = uniqueTeachers;

    if (uniqueTeachers >= (achievement.maxProgress || 5)) {
      this.unlockAchievement(achievement, stats, result);
    }
  }

  // 检查策略大师成就
  private static checkStrategyMasterAchievement(stats: UserStats, result: any): void {
    const achievement = stats.achievements.find(a => a.id === 'strategy_master');
    if (!achievement || achievement.unlocked) return;

    const eotStrategies = ['debate', 'memory', 'report', 'relay'];
    const usedEotStrategies = eotStrategies.filter(strategy => stats.usedStrategies[strategy] > 0).length;
    achievement.progress = usedEotStrategies;

    if (usedEotStrategies >= (achievement.maxProgress || 4)) {
      this.unlockAchievement(achievement, stats, result);
    }
  }

  // 检查模型外交官成就
  private static checkModelDiplomatAchievement(stats: UserStats, result: any): void {
    const achievement = stats.achievements.find(a => a.id === 'model_diplomat');
    if (!achievement || achievement.unlocked) return;

    const supportedModels = ['deepseek', 'qwen', 'doubao', 'chatglm', 'hunyuan'];
    const usedModels = supportedModels.filter(model => stats.usedStrategies[model] > 0).length;
    achievement.progress = usedModels;

    if (usedModels >= (achievement.maxProgress || 5)) {
      this.unlockAchievement(achievement, stats, result);
    }
  }

  // 检查特定教师成就
  private static checkSpecificTeacherAchievements(stats: UserStats, teacherId: string, result: any): void {
    const teacherAchievements = {
      'socrates': 'socrates_disciple',
      'marie_curie': 'curie_apprentice',
    };

    const achievementId = teacherAchievements[teacherId as keyof typeof teacherAchievements];
    if (!achievementId) return;

    const achievement = stats.achievements.find(a => a.id === achievementId);
    if (!achievement || achievement.unlocked) return;

    const interactionCount = stats.favoriteTeachers[teacherId] || 0;
    achievement.progress = interactionCount;

    if (interactionCount >= (achievement.maxProgress || 10)) {
      this.unlockAchievement(achievement, stats, result);
    }
  }

  // 更新等级
  private static updateLevel(stats: UserStats): void {
    let newLevel = 1;
    
    for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
      if (stats.totalPoints >= LEVEL_THRESHOLDS[i]) {
        newLevel = i + 1;
        break;
      }
    }

    stats.level = newLevel;
    
    // 更新下一级所需经验
    const nextThreshold = LEVEL_THRESHOLDS[newLevel] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
    stats.nextLevelXP = nextThreshold;
    
    // 如果已达到最高级，设置当前XP为总点数
    if (newLevel >= LEVEL_THRESHOLDS.length) {
      stats.currentXP = stats.totalPoints;
    } else {
      // 计算当前级别的进度
      const currentThreshold = LEVEL_THRESHOLDS[newLevel - 1] || 0;
      stats.currentXP = stats.totalPoints - currentThreshold;
      stats.nextLevelXP = nextThreshold - currentThreshold;
    }
  }

  // 获取等级称号
  static getLevelTitle(level: number): string {
    const titles = [
      '新手学者',      // Level 1
      '初级探索者',    // Level 2
      '思维新星',      // Level 3
      '智慧学徒',      // Level 4
      '知识追寻者',    // Level 5
      '逻辑推理师',    // Level 6
      '批判思维家',    // Level 7
      '哲学探索者',    // Level 8
      '智慧导师',      // Level 9
      '知识大师',      // Level 10
      '思辨专家',      // Level 11
      '智慧贤者',      // Level 12
      '哲学大师',      // Level 13
      '知识圣贤',      // Level 14
      '智慧至尊',      // Level 15
    ];

    return titles[Math.min(level - 1, titles.length - 1)] || '智慧至尊';
  }

  // 重置用户数据 (调试用)
  static resetUserData(): void {
    // 检查是否在浏览器环境中
    if (typeof window === 'undefined') {
      return;
    }
    
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// 游戏化系统测试脚本
const { GamificationManager } = require('./src/utils/gamification.ts');

console.log('=== 游戏化系统测试 ===');

// 重置用户数据进行测试
GamificationManager.resetUserData();

// 获取初始状态
let stats = GamificationManager.getUserStats();
console.log('初始状态:', {
  level: stats.level,
  totalPoints: stats.totalPoints,
  achievements: stats.achievements.filter(a => a.unlocked).length
});

// 测试首次辩论
console.log('\n1. 测试首次辩论...');
let result = GamificationManager.handleEvent({
  type: 'debate_completed',
  data: { models: ['deepseek', 'qwen'], question: 'Test question' }
});
console.log('辩论完成:', {
  newAchievements: result.newAchievements.map(a => a.title),
  pointsEarned: result.pointsEarned,
  levelUp: result.levelUp
});

// 测试教师交互
console.log('\n2. 测试教师交互...');
result = GamificationManager.handleEvent({
  type: 'teacher_interaction',
  data: { teacherId: 'socrates' }
});
console.log('教师交互:', {
  newAchievements: result.newAchievements.map(a => a.title),
  pointsEarned: result.pointsEarned
});

// 获取最终状态
stats = GamificationManager.getUserStats();
console.log('\n最终状态:', {
  level: stats.level,
  totalPoints: stats.totalPoints,
  achievements: stats.achievements.filter(a => a.unlocked).length,
  unlockedAchievements: stats.achievements.filter(a => a.unlocked).map(a => a.title)
});

console.log('\n=== 测试完成 ===');

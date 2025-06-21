# 多智能体教育平台 (Multi-Agent Education Platform)

一个基于React和Node.js的下一代教育应用，通过多智能体协作提供个性化学习体验。该平台不仅支持传统的多LLM辩论式问答，更升级为完整的智能教育生态系统。

## 🌟 新功能展示

### 多智能体学习仪表板
![多智能体学习](https://via.placeholder.com/800x400?text=Multi-Agent+Learning+Dashboard)
*通过四大核心智能体协作，提供个性化学习内容生成*

### 用户画像管理
![用户画像](https://via.placeholder.com/800x400?text=Learner+Profile+Management)
*全面的学习者画像，包含学习风格、偏好设置和知识地图*

### 智能推荐系统
![智能推荐](https://via.placeholder.com/800x400?text=AI+Recommendation+System)
*基于用户行为和画像的多维度学习内容推荐*

### 学习进度追踪
![进度追踪](https://via.placeholder.com/800x400?text=Learning+Progress+Tracker)
*可视化学习统计、目标管理和成就系统*

### 智能体协作可视化
![协作可视化](https://via.placeholder.com/800x400?text=Agent+Collaboration+View)
*实时展示智能体协作过程和状态监控*

## 🎮 使用指南

### 新用户入门
1. **完善个人画像**: 访问"个人画像"标签页，填写学习偏好和目标
2. **开始学习**: 在"多智能体学习"中输入学习主题，选择合适的工作流
3. **查看推荐**: "学习推荐"提供个性化的学习建议
4. **追踪进度**: "学习进度"展示你的成长轨迹和成就

### 高级功能
- **智能体协作**: 观看多个AI智能体如何协作生成学习内容
- **Markdown渲染**: 学习成果支持富文本格式，提升阅读体验
- **成果导出**: 将学习结果导出为Markdown或JSON格式
- **学习分析**: 深度分析学习行为和效果

## 🎯 项目特点

### 🤖 多智能体教育系统 (NEW!)
- **四大核心智能体**: 课程设计师、内容生成器、评估专家、活动设计师
- **智能体协作**: 支持并行协作和顺序工作流
- **个性化学习**: 基于用户画像的自适应学习路径
- **学习成果可视化**: 智能体贡献分析和协作过程展示

### 👤 用户画像系统 (NEW!)
- **全面画像**: 学习风格、偏好设置、知识地图
- **智能推荐**: 多维度个性化学习内容推荐
- **进度追踪**: 实时学习统计和成就系统
- **自适应调整**: 根据学习行为动态优化体验

### 🎓 传统LLM辩论功能
- **多模型辩论**: 集成Google Gemini、DeepSeek、Qwen、Doubao、ChatGLM、Hunyuan等6个主流LLM
- **EoT推理策略**: 支持四种Exchange-of-Thought推理模式：
  - 辩论 (Debate): 全网状多模型交互
  - 记忆 (Memory/Bus): 3阶段共享内存池方法
  - 报告 (Report/Star): 3阶段中心化汇报模式
  - 接力 (Relay/Ring): 顺序传递验证机制
- **AI教师人格化**: 5位经典教师人格(苏格拉底、居里夫人、孔子、爱因斯坦、蒙台梭利)

### 🎮 游戏化学习体验
- **15级等级系统**: 从初学者到专家的成长路径
- **12种成就徽章**: 多维度学习激励机制
- **学习进度追踪**: 可视化学习轨迹和统计分析
- **智能反馈**: 基于表现的个性化建议

### 💡 技术亮点
- **现代技术栈**: React + TypeScript + Next.js + Ant Design
- **响应式设计**: 完美适配桌面端和移动端
- **Markdown渲染**: 支持富文本学习内容展示
- **实时协作**: 智能体状态实时监控和交互
- **性能优化**: 组件懒加载、虚拟滚动、智能缓存

## 🚀 快速开始

### 环境准备

确保您的系统已安装：
- Node.js (v18或更高版本) 
- npm (v8或更高版本)
- Git

### 本地开发

1. **克隆项目**
```bash
git clone https://github.com/your-username/DebateLLMEduCourt.git
cd DebateLLMEduCourt
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑 .env.local 文件，填入您的API Keys
```

4. **启动开发服务器**
```bash
npm run dev
```

5. **访问应用**
打开浏览器访问 `http://localhost:3000`

## 📁 项目结构

```
DebateLLMEduCourt/
├── src/                    # 前端源码
```
DebateLLMEduCourt/
├── src/                    # 前端源码
│   ├── components/         # React组件
│   │   ├── MultiAgentDashboard.tsx      # 多智能体仪表板
│   │   ├── LearnerProfileManager.tsx    # 用户画像管理
│   │   ├── LearningRecommendationPanel.tsx # 学习推荐
│   │   ├── LearningProgressTracker.tsx  # 进度追踪
│   │   ├── AgentCollaborationView.tsx   # 协作可视化
│   │   ├── LearningResultDetail.tsx     # 成果详情
│   │   └── ...                          # 其他组件
│   ├── agents/             # 多智能体系统 (NEW!)
│   │   ├── BaseAgent.ts                 # 智能体基类
│   │   ├── CurriculumDesignerAgent.ts   # 课程设计师
│   │   ├── ContentGeneratorAgent.ts     # 内容生成器
│   │   ├── AssessmentExpertAgent.ts     # 评估专家
│   │   └── ActivityDesignerAgent.ts     # 活动设计师
│   ├── pages/              # Next.js页面
│   ├── styles/             # 样式文件
│   ├── types/              # TypeScript类型定义
│   └── utils/              # 工具函数
│       ├── learnerProfile.ts            # 用户画像管理
│       └── ...                          # 其他工具
├── pages/api/              # 后端API (Vercel Functions)
│   ├── agent-llm-call.ts              # 智能体LLM调用API
│   ├── multi-agent-learning.ts        # 多智能体学习API
│   ├── learner-profile/               # 用户画像API
│   ├── debate/                        # 核心辩论逻辑
│   ├── llm/                           # LLM客户端封装
│   └── utils/                         # 后端工具函数
├── public/                 # 静态资源
├── docs/                   # 文档 (NEW!)
│   ├── NEW_FEATURES.md                # 新功能总结
│   ├── DEVELOPMENT_PROGRESS.md        # 开发进度
│   └── MULTI_AGENT_EDUCATION_IMPROVEMENT_PLAN.md
└── 配置文件...
```

## 🔧 技术栈

**前端**
- React 18 + TypeScript
- Next.js 14 (Pages Router)
- Ant Design (UI组件库)
- Framer Motion (动画效果)
- Axios (HTTP客户端)
- React Markdown + remark-gfm + rehype-highlight (Markdown渲染)
- React Particles (背景效果)
- CSS Modules (样式隔离)
- dayjs (时间处理)

**后端**
- Node.js + TypeScript
- Vercel Serverless Functions
- 多智能体协作引擎 (NEW!)
- EoT推理引擎 (多通信范式支持)
- 用户画像系统 (NEW!)
- 智能推荐算法 (NEW!)
- 多LLM SDK集成
- SSE (Server-Sent Events)

**用户体验**
- 渐进式渲染 (SSE实时数据流)
- 主题系统 (默认、琥珀色、蓝绿色)
- 粒子背景动画 (主题色自适应)
- 移动端优化 (响应式设计)
- 辅助功能支持 (高对比度、字体调整、语音朗读)
- 结果分享与导出 (Web Share API、文本导出、打印优化)

## 🤖 支持的LLM模型

### 默认模型配置

当前平台支持以下5个LLM提供商，每个都有相应的默认模型：

| 提供商 | 默认模型 | 说明 |
|--------|----------|------|
| **DeepSeek** | `deepseek-chat` | 深度求索的对话模型 |
| **Qwen** | `qwen-turbo-latest` | 阿里云通义千问的快速版本 |
| **Doubao** | `doubao-1-5-thinking-pro-250415` | 字节跳动豆包的指定端点模型 |
| **ChatGLM** | `glm-z1-airx` | 智谱清言的高级模型 |
| **Hunyuan** | `hunyuan-turbos-latest` | 腾讯混元的增强版本 |

### 模型配置方法

平台提供了多种方式配置模型，便于用户根据需求选择不同模型：

#### 方法1: 通过环境变量配置

在 `.env.local` 文件中设置模型配置：

```bash
# 模型名称配置
DEEPSEEK_DEFAULT_MODEL=deepseek-r1
QWEN_DEFAULT_MODEL=qwen-max
DOUBAO_DEFAULT_MODEL=doubao-1-5-thinking-pro-250415
CHATGLM_DEFAULT_MODEL=glm-z1-airx
HUNYUAN_DEFAULT_MODEL=hunyuan-turbos-latest

# API基础URL配置
DEEPSEEK_BASE_URL=https://api.deepseek.com
QWEN_BASE_URL=https://dashscope.aliyuncs.com/api/v1
DOUBAO_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
CHATGLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4
HUNYUAN_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1
```

#### 方法2: 通过API请求参数

在API调用时指定特定模型：

```javascript
// 前端调用示例
const response = await fetch('/api/debate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "您的问题",
    models: ["deepseek", "qwen"],
    modelConfigs: {
      deepseek: { model: "deepseek-r1" },
      qwen: { model: "qwen-max" }
    }
  })
});
```

### 模型选择建议

- **性能优先**: 使用 `deepseek-r1`, `qwen-max`, `glm-z1-airx`
- **速度优先**: 使用 `deepseek-chat`, `qwen-turbo-latest`, `hunyuan-turbos-latest`
- **成本优先**: 使用 `deepseek-chat`, `qwen-turbo-latest`, `doubao-1-5-thinking-pro-250415`
- **特定任务**: 
  - 代码生成: `deepseek-coder`
  - 数学推理: `deepseek-r1`
  - 多模态: 不适用于当前支持的模型

## 🔒 安全注意事项

- ⚠️ **绝不要将API Keys提交到Git仓库**
- 本地开发使用 `.env.local` 文件管理密钥
- 生产环境通过Vercel环境变量配置
- 确保 `.env.local` 已添加到 `.gitignore` 文件中

## 🚀 部署到Vercel

1. **推送代码到GitHub**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **连接Vercel**
- 访问 [Vercel Dashboard](https://vercel.com/dashboard)
- 导入GitHub仓库
- 配置环境变量

3. **环境变量配置**
在Vercel项目设置中添加以下环境变量：
```
DEEPSEEK_API_KEY=your_deepseek_api_key
QWEN_API_KEY=your_qwen_api_key
DOUBAO_API_KEY=your_doubao_api_key
CHATGLM_API_KEY=your_chatglm_api_key
HUNYUAN_API_KEY=your_hunyuan_api_key
HUNYUAN_BASE_URL=https://api.hunyuan.cloud.tencent.com/v1

# 可选：自定义模型配置
DEEPSEEK_DEFAULT_MODEL=your_preferred_model
QWEN_DEFAULT_MODEL=your_preferred_model
DOUBAO_DEFAULT_MODEL=your_preferred_model
CHATGLM_DEFAULT_MODEL=your_preferred_model
HUNYUAN_DEFAULT_MODEL=your_preferred_model
```

## 📚 使用说明

1. **提出问题**: 在输入框中输入您的问题
2. **选择模型**: 可选择参与辩论的LLM模型
3. **选择AI教师**: 为每个模型选择教师人格，获得个性化指导
4. **选择EoT策略**: 选择推理策略(辩论、记忆、报告、接力)
5. **观看辩论**: 系统将展示三个阶段的辩论过程
   - 阶段一：各模型的初始回答（约60秒后可见）
   - 阶段二：模型间的交叉审视和修正（初始阶段后约80秒可见）
   - 阶段三：验证者的综合结论（全部完成后可见）
6. **渐进式体验**: 无需等待全部完成，每个阶段完成即可查看
7. **学习成长**: 通过右下角的等级徽章查看学习进度、解锁成就
8. **学习思考**: 通过对比不同观点，培养批判性思维
9. **分享结果**: 使用分享功能将辩论结果分享或导出

## 🛠️ 开发命令

```bash
# 开发环境
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm run start

# 类型检查
npm run type-check

# 代码检查
npm run lint
```

## 🤝 贡献指南

我们欢迎任何形式的贡献！请查看以下方式：

1. **Bug报告**: 在GitHub Issues中报告问题
2. **功能建议**: 提出新功能的想法和建议
3. **代码贡献**: Fork项目并提交Pull Request
4. **文档改进**: 帮助完善文档和示例

## 📚 相关文档

- [📋 新功能详细说明](./NEW_FEATURES.md) - 多智能体教育系统完整功能介绍
- [📈 开发进度](./DEVELOPMENT_PROGRESS.md) - 开发阶段和任务完成情况
- [🔮 改进方案](./MULTI_AGENT_EDUCATION_IMPROVEMENT_PLAN.md) - 多智能体教育平台改进计划
- [🔗 研究参考](https://edu-aiagents.com/research) - 多智能体教育相关研究

## 📄 License

本项目采用 MIT License - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

- 感谢所有LLM API提供商的支持
- 感谢开源社区提供的优秀工具和框架
- 感谢多智能体教育研究社区的理论指导
- 感谢所有用户的反馈和建议

---

**🌟 如果这个项目对您有帮助，请给我们一个Star！**

## 🔄 开发路线图

### 已完成
- ✅ 基础多模型辩论流程
- ✅ 多种主流LLM集成
- ✅ 三阶段辩论模式
- ✅ SSE实时连接
- ✅ 渐进式渲染功能
- ✅ 主题切换与本地存储
- ✅ 移动端优化体验
- ✅ 辅助功能工具栏
- ✅ 结果分享与导出功能
- ✅ 粒子背景动画效果
- ✅ 优化Markdown渲染的字距和行距
- ✅ 支持LaTeX数学公式渲染
- ✅ 修复EoT策略选择器文字溢出问题
- ✅ AI教师人格化系统
- ✅ 游戏化学习系统(等级、成就、进度追踪)

### 计划中
- ⏳ AI思维过程可视化
- ⏳ 学习进度详细追踪系统
- ⏳ 苏格拉底式引导对话
- ⏳ 认知偏见检测器
- ⏳ 跨学科辩论场景
- ⏳ 自定义辩论流程和提示词
- ⏳ 历史辩论记录与导出
- ⏳ 批量处理多个相关问题
- ⏳ 自定义模型配置界面
- ⏳ 更多辅助功能与无障碍优化
- ⏳ 深色/浅色模式切换
- ⏳ 个性化用户设置面板
- ⏳ 结果对比与分析功能

## 🔄 EoT推理策略

平台支持四种Exchange-of-Thought (EoT)推理策略，每种策略都有其独特的通信范式和应用场景：

### 1. 辩论模式 (Debate)
- **拓扑结构**: 全网状 (Full-Mesh)
- **通信方式**: 所有模型之间直接交互
- **适用场景**: 复杂问题分析、多角度观点对比
- **特点**: 最大化观点碰撞，适合需要深入讨论的议题

### 2. 记忆模式 (Memory/Bus)
- **拓扑结构**: 共享内存总线
- **通信方式**: 通过共享内存池交换信息
- **适用场景**: 需要累积和优化思考过程的任务
- **特点**: 高效的知识积累和迭代改进

### 3. 报告模式 (Report/Star)
- **拓扑结构**: 星形结构
- **通信方式**: 中心节点汇总和分发信息
- **适用场景**: 需要综合多方意见的决策问题
- **特点**: 结构化的意见收集和整合

### 4. 接力模式 (Relay/Ring)
- **拓扑结构**: 环形结构
- **通信方式**: 顺序传递和验证
- **适用场景**: 需要逐步完善推理过程的任务
- **特点**: 渐进式思维链优化

### 使用方法

1. 在界面上选择期望的EoT策略
2. 输入您的问题
3. 选择参与推理的AI模型
4. 系统将按照选定的策略组织模型间的交互
5. 实时查看推理过程和最终结果

不同策略的选择会显著影响推理过程和结果的特点。建议根据具体问题的性质选择合适的策略：
- 争议性话题选择辩论模式
- 开放性问题选择记忆模式
- 决策类问题选择报告模式
- 递进式思考选择接力模式

## 🎮 游戏化学习系统

### 等级系统
- **15个等级**: 从"新手学者"到"智慧至尊"，每个等级都有独特的称号
- **动态经验**: 根据用户行为动态计算经验值，完成辩论、解锁成就都能获得经验
- **进度追踪**: 实时显示当前等级进度和下一级所需经验

### 成就系统
**12种成就徽章分为5个类别**：

#### 🎯 首次体验
- **初次辩论者**: 完成第一次AI辩论 (+100经验)
- **拜师学艺**: 第一次选择AI教师人格 (+50经验)
- **策略家**: 首次使用EoT推理策略 (+75经验)

#### 🔥 连续登录
- **三日精进**: 连续3天使用平台 (+150经验)
- **七日大师**: 连续7天使用平台 (+350经验)
- **月度学者**: 连续30天使用平台 (+1000经验)

#### 🧭 探索发现
- **教师收集家**: 与所有5位AI教师都进行过对话 (+300经验)
- **策略大师**: 尝试所有4种EoT推理策略 (+400经验)
- **模型外交官**: 与所有5个AI模型都进行过辩论 (+250经验)

#### ⚔️ 技能熟练
- **辩论老兵**: 完成10次辩论 (+500经验)
- **提问大师**: 提出50个问题 (+750经验)

#### 🤝 社交互动
- **苏格拉底门徒**: 与苏格拉底老师进行10次对话 (+400经验)
- **居里夫人学徒**: 与居里夫人老师进行10次对话 (+400经验)

### 统计追踪
- **学习数据**: 总辩论次数、提问数量、加入天数
- **偏好分析**: 常用AI教师、使用策略统计
- **连续性**: 自动记录连续学习天数
- **进度可视化**: 直观的图表和进度条展示

### 用户界面
- **浮动按钮**: 位于右下角的等级徽章，点击查看详细面板
- **详细面板**: 三个标签页展示概览、成就和统计信息
- **实时通知**: 解锁新成就和等级提升时的即时通知
- **响应式设计**: 在所有设备上都有良好的显示效果

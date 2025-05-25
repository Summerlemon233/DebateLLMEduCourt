# 多LLM辩论教育平台 (DebateLLMEduCourt)

一个基于React和Node.js的教育应用，通过接入多个大型语言模型(LLM)实现辩论式问答，帮助用户通过不同视角理解复杂问题，培养批判性思维。

## 🎯 项目特点

- **多模型辩论**: 集成Google Gemini、DeepSeek、Qwen、Doubao、ChatGLM、Hunyuan等6个主流LLM
- **三阶段流程**: 初始回答 → 交叉审视修正 → 最终验证与综合
- **渐进式渲染**: 每个辩论阶段完成后立即展示结果，无需等待全部完成
- **教育导向**: 通过展示不同观点减少AI幻觉，提升学习效果
- **现代技术栈**: React + TypeScript + Next.js + Ant Design + Vercel部署
- **用户体验优化**: 主题系统、粒子背景动画、移动端优化、辅助功能增强
- **结果分享导出**: 支持多种方式分享和导出辩论结果

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
│   ├── components/         # React组件
│   ├── pages/              # Next.js页面
│   ├── styles/             # 样式文件
│   ├── types/              # TypeScript类型定义
│   └── utils/              # 工具函数
├── api/                    # 后端API (Vercel Functions)
│   ├── debate/             # 核心辩论逻辑
│   ├── llm/                # LLM客户端封装
│   └── utils/              # 后端工具函数
├── public/                 # 静态资源
└── 配置文件...
```

## 🔧 技术栈

**前端**
- React 18 + TypeScript
- Next.js 14 (Pages Router)
- Ant Design (UI组件库)
- Framer Motion (动画效果)
- Axios (HTTP客户端)
- React Markdown (结果渲染)
- React Particles (背景效果)
- CSS 变量 (主题系统)

**后端**
- Node.js + TypeScript
- Vercel Serverless Functions
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
3. **观看辩论**: 系统将展示三个阶段的辩论过程
   - 阶段一：各模型的初始回答（约60秒后可见）
   - 阶段二：模型间的交叉审视和修正（初始阶段后约80秒可见）
   - 阶段三：验证者的综合结论（全部完成后可见）
4. **渐进式体验**: 无需等待全部完成，每个阶段完成即可查看
5. **学习思考**: 通过对比不同观点，培养批判性思维
6. **分享结果**: 使用分享功能将辩论结果分享或导出

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

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙋‍♂️ 支持

如果您有任何问题或建议，请通过以下方式联系：

- 创建 [Issue](https://github.com/Summerlemon233/DebateLLMEduCourt/issues)

---

**⭐ 如果这个项目对您有帮助，请给它一个星标！**

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

### 计划中
- ⏳ 自定义辩论流程和提示词
- ⏳ 历史辩论记录与导出
- ⏳ 批量处理多个相关问题
- ⏳ 自定义模型配置界面
- ⏳ 更多辅助功能与无障碍优化
- ⏳ 深色/浅色模式切换
- ⏳ 个性化用户设置面板
- ⏳ 结果对比与分析功能

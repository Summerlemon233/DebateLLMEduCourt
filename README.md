# 多LLM辩论教育平台 (DebateLLMEduCourt)

一个基于React和Node.js的教育应用，通过接入多个大型语言模型(LLM)实现辩论式问答，帮助用户通过不同视角理解复杂问题，培养批判性思维。

## 🎯 项目特点

- **多模型辩论**: 集成Google Gemini、DeepSeek、Qwen、Doubao、ChatGLM、Hunyuan等6个主流LLM
- **三阶段流程**: 初始回答 → 交叉审视修正 → 最终验证与综合
- **教育导向**: 通过展示不同观点减少AI幻觉，提升学习效果
- **现代技术栈**: React + TypeScript + Next.js + Ant Design + Vercel部署

## 🏗️ 技术架构

### 前端
- **框架**: Next.js 14 (React 18)
- **语言**: TypeScript
- **UI库**: Ant Design
- **样式**: CSS Modules + Ant Design主题

### 后端
- **API**: Next.js API Routes
- **LLM集成**: 6个主流LLM提供商统一接口
- **错误处理**: 重试机制 + 降级策略
- **类型安全**: 完整的TypeScript类型定义

### 部署
- **平台**: Vercel (推荐)
- **环境**: Node.js 18+
- **配置**: 环境变量管理

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
# 注意：请从API_Key.txt中获取相应的密钥并手动填入.env.local文件
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
│   ├── pages/             # Next.js页面
│   ├── styles/            # 样式文件
│   ├── types/             # TypeScript类型定义
│   └── utils/             # 工具函数
├── api/                   # 后端API (Vercel Functions)
│   ├── debate.ts          # 核心辩论逻辑
│   ├── llm/              # LLM客户端封装
│   └── utils/            # 后端工具函数
├── public/               # 静态资源
└── 配置文件...
```

## 🔧 技术栈

**前端**
- React 18 + TypeScript
- Next.js 14 (Pages Router)
- Ant Design (UI组件库)
- Axios (HTTP客户端)

**后端**
- Node.js + TypeScript
- Vercel Serverless Functions
- 多LLM SDK集成

**部署**
- Vercel (前端 + Serverless Functions)
- 环境变量管理

## 🤖 支持的LLM模型

### 默认模型配置

当前平台支持以下6个LLM提供商，每个都有相应的默认模型：

| 提供商 | 默认模型 | 说明 |
|--------|----------|------|
| **Google Gemini** | `gemini-1.5-flash` | 谷歌的快速多模态大模型 |
| **DeepSeek** | `deepseek-chat` | 深度求索的对话模型 |
| **Qwen** | `qwen-turbo` | 阿里云通义千问的快速版本 |
| **Doubao** | `ep-20241218114516-ftqf5` | 字节跳动豆包的指定端点模型 |
| **ChatGLM** | `glm-4` | 智谱清言的GLM-4模型 |
| **Tencent Hunyuan** | `hunyuan-lite` | 腾讯混元的轻量版本 |

### 如何修改默认模型

如果您想使用不同的模型版本（例如DeepSeek R1而不是DeepSeek V3），可以通过以下方式修改：

#### 方法1: 修改LLM客户端文件

编辑对应的LLM客户端文件中的默认模型配置：

**DeepSeek示例** (`api/llm/deepseek.ts`):
```typescript
// 将第73行的默认模型修改为：
this.model = (config as DeepSeekConfig)?.model || 'deepseek-r1';  // 原为 'deepseek-chat'
```

**Google Gemini示例** (`api/llm/gemini.ts`):
```typescript
// 将第38行的默认模型修改为：
this.modelName = (config as GeminiConfig)?.model || 'gemini-1.5-pro';  // 原为 'gemini-1.5-flash'
```

**ChatGLM示例** (`api/llm/chatglm.ts`):
```typescript
// 将第112行的默认模型修改为：
model: options.model || 'glm-4-plus',  // 原为 'glm-4'
```

#### 方法2: 通过环境变量配置

在 `.env.local` 文件中添加模型配置（此功能需要进一步开发）：

```bash
# 自定义模型配置 (计划功能)
GEMINI_DEFAULT_MODEL=gemini-1.5-pro
DEEPSEEK_DEFAULT_MODEL=deepseek-r1
QWEN_DEFAULT_MODEL=qwen-max
DOUBAO_DEFAULT_MODEL=your-custom-endpoint
CHATGLM_DEFAULT_MODEL=glm-4-plus
HUNYUAN_DEFAULT_MODEL=hunyuan-pro
```

#### 方法3: 通过API请求参数

在API调用时指定特定模型（高级用法）：

```javascript
// 前端调用示例
const response = await fetch('/api/debate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    question: "您的问题",
    models: ["gemini", "deepseek"],
    modelConfigs: {
      gemini: { model: "gemini-1.5-pro" },
      deepseek: { model: "deepseek-r1" }
    }
  })
});
```

### 模型选择建议

- **性能优先**: 使用 `gemini-1.5-pro`, `gpt-4`, `deepseek-r1`
- **速度优先**: 使用 `gemini-1.5-flash`, `qwen-turbo`, `hunyuan-lite`
- **成本优先**: 使用 `deepseek-chat`, `qwen-turbo`, `hunyuan-lite`
- **特定任务**: 
  - 代码生成: `deepseek-coder`
  - 数学推理: `deepseek-r1`
  - 多模态: `gemini-1.5-pro`

### 注意事项

1. **API兼容性**: 确保选择的模型被相应提供商支持
2. **计费影响**: 不同模型的调用费用可能差异很大
3. **性能差异**: 更强大的模型通常响应时间更长
4. **配额限制**: 某些高级模型可能有更严格的使用限制

## 🔒 安全注意事项

- ⚠️ **绝不要将API Keys提交到Git仓库**
- 本地开发使用 `.env` 文件管理密钥
- 生产环境通过Vercel环境变量配置
- `API_Key.txt` 文件已被 `.gitignore` 排除

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
- 配置环境变量（从API_Key.txt复制相应的Keys）

3. **环境变量配置**
在Vercel项目设置中添加以下环境变量：
```
GOOGLE_GEMINI_API_KEY=your_actual_key
DEEPSEEK_API_KEY=your_actual_key
QWEN_API_KEY=your_actual_key
DOUBAO_API_KEY=your_actual_key
CHATGLM_API_KEY=your_actual_key
HUNYUAN_API_KEY=your_actual_key
```

## 📚 使用说明

1. **提出问题**: 在输入框中输入您的问题
2. **选择模型**: 可选择参与辩论的LLM模型
3. **观看辩论**: 系统将展示三个阶段的辩论过程
   - 阶段一：各模型的初始回答
   - 阶段二：模型间的交叉审视和修正
   - 阶段三：验证者的综合结论
4. **学习思考**: 通过对比不同观点，培养批判性思维

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

- 创建 [Issue](https://github.com/your-username/DebateLLMEduCourt/issues)
- 发送邮件到: your-email@example.com

---

**⭐ 如果这个项目对您有帮助，请给它一个星标！**

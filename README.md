# 多LLM辩论教育平台 (基础版)

一个基于React和Node.js的教育应用，通过接入多个大型语言模型(LLM)实现辩论式问答，帮助用户通过不同视角理解复杂问题，培养批判性思维。

## 🎯 项目特点

- **多模型辩论**: 集成Google Gemini、DeepSeek、Qwen等多个主流LLM
- **三阶段流程**: 初始回答 → 交叉审视修正 → 验证者综合
- **教育导向**: 通过展示不同观点减少AI幻觉，提升学习效果
- **现代技术栈**: React + TypeScript + Next.js + Vercel部署

## 🚀 快速开始

### 环境准备

确保您的系统已安装：
- Node.js (v18或更高版本)
- npm 或 yarn
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
# 或
yarn install
```

3. **配置环境变量**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入您的API Keys
# 注意：请从API_Key.txt中获取相应的密钥并手动填入.env文件
```

4. **启动开发服务器**
```bash
npm run dev
# 或
yarn dev
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

- **Google Gemini** - 谷歌的多模态大模型
- **DeepSeek** - 深度求索的代码和推理模型  
- **Qwen** - 阿里云通义千问
- **Doubao** - 字节跳动豆包
- **ChatGLM** - 智谱清言
- **Tencent Hunyuan** - 腾讯混元

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

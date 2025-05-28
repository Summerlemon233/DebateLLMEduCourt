import React from 'react';
import { Card, Typography } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

const { Title } = Typography;

const TestPage: React.FC = () => {
  const testMarkdown = `
# 测试页面

## 文字间距测试
这是一段普通的文字，用来测试字间距是否合适。我们调整了 letter-spacing 为 0.02em 和 line-height 为 1.6，希望能获得更好的阅读体验。

这是另一段文字，包含一些中文和English混合内容，测试不同字符的间距效果。

## LaTeX公式测试

### 行内公式
这是一个行内公式：$E = mc^2$，爱因斯坦的质能方程。

### 块级公式
这是一个块级公式：

$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

### 复杂公式
傅里叶变换公式：

$$F(\\omega) = \\int_{-\\infty}^{\\infty} f(t) e^{-i\\omega t} dt$$

二次公式：

$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$

### 矩阵
$$\\begin{pmatrix}
a & b \\\\
c & d
\\end{pmatrix}$$

## 代码测试
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

## 表格测试
| 模型 | 准确率 | 速度 |
|------|--------|------|
| GPT-4 | 95% | 中等 |
| Claude | 93% | 快 |
| DeepSeek | 91% | 快 |
`;

  const MarkdownComponents = {
    p: ({ children }: any) => (
      <Typography.Paragraph style={{ 
        marginBottom: '16px', 
        lineHeight: '1.6', 
        fontSize: '1rem', 
        color: 'var(--text-primary)',
        letterSpacing: '0.02em'
      }}>
        {children}
      </Typography.Paragraph>
    ),
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={1}>文字间距和LaTeX公式测试</Title>
      
      <Card>
        <ReactMarkdown 
          components={MarkdownComponents as any}
          remarkPlugins={[remarkGfm, remarkMath]}
          rehypePlugins={[rehypeKatex]}
        >
          {testMarkdown}
        </ReactMarkdown>
      </Card>
    </div>
  );
};

export default TestPage;

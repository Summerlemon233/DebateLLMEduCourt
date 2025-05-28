import React, { useState, useRef } from 'react';
import { Typography, Tag, Space, Tabs, Empty, Button, message, Tooltip, Modal } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RobotOutlined,
  StarOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  FileDoneOutlined,
  ThunderboltOutlined,
  SyncOutlined,
  SafetyOutlined,
  ShareAltOutlined,
  CopyOutlined,
  PrinterOutlined,
  DownloadOutlined,
  FileTextOutlined,
  AudioOutlined
} from '@ant-design/icons';
import type { DebateResult, DebateStage, LLMResponse } from '../types';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ResultDisplayProps {
  result: DebateResult | null;
  isLoading: boolean;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, isLoading }) => {
  const [selectedStage, setSelectedStage] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const resultContainerRef = useRef<HTMLDivElement>(null);

  // 分享结果功能
  const handleShare = async () => {
    if (!result) return;
    
    try {
      // 构建要分享的文本
      const shareText = `
多LLM辩论教育平台 - 辩论结果

问题: ${result.question}

${result.summary ? `总结: ${result.summary}` : ''}
      `.trim();
      
      // 检查Web Share API是否可用
      if (navigator.share) {
        await navigator.share({
          title: '多LLM辩论结果',
          text: shareText,
        });
        message.success('分享成功！');
      } else {
        // 如果不支持分享API，则复制到剪贴板
        await navigator.clipboard.writeText(shareText);
        message.success('已复制到剪贴板，现在您可以粘贴分享');
      }
    } catch (error) {
      console.error('分享失败:', error);
      message.error('分享失败，请稍后再试');
    }
  };
  
  // 复制结果
  const handleCopy = async () => {
    if (!result) return;
    
    try {
      // 构建要复制的文本
      const copyText = `
# 多LLM辩论教育平台 - 辩论结果

## 问题
${result.question}

## 参与模型
${result.models.join(', ')}

${result.stages.map((stage, index) => `
## ${index === 0 ? '初始提案阶段' : index === 1 ? '交叉审视阶段' : '最终验证阶段'}
${stage.responses.map(r => `
### ${getModelInfo(r.model).name}
${r.content}
`).join('\n')}
`).join('\n')}

## 总结
${result.summary || '无总结'}
      `.trim();
      
      await navigator.clipboard.writeText(copyText);
      message.success('已复制到剪贴板');
    } catch (error) {
      console.error('复制失败:', error);
      message.error('复制失败，请稍后再试');
    }
  };
  
  // 打印结果
  const handlePrint = () => {
    window.print();
  };
  
  // 语音朗读功能
  const handleSpeakResult = () => {
    if (!result) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }
    
    setIsSpeaking(true);
    
    // 构建朗读文本
    const speakText = `
      问题: ${result.question}.
      
      总结: ${result.summary || '无总结'}
    `.trim();
    
    const utterance = new SpeechSynthesisUtterance(speakText);
    utterance.lang = 'zh-CN';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      message.error('语音朗读失败');
    };
    
    window.speechSynthesis.speak(utterance);
  };
  
  // 导出为文本文件
  const handleExportText = () => {
    if (!result) return;
    
    const exportText = `
# 多LLM辩论教育平台 - 辩论结果

## 问题
${result.question}

## 参与模型
${result.models.join(', ')}

${result.stages.map((stage, index) => `
## ${index === 0 ? '初始提案阶段' : index === 1 ? '交叉审视阶段' : '最终验证阶段'}
${stage.responses.map(r => `
### ${getModelInfo(r.model).name}
${r.content}
`).join('\n')}
`).join('\n')}

## 总结
${result.summary || '无总结'}
    `.trim();
    
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `辩论结果_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setIsExportModalVisible(false);
    message.success('导出成功！');
  };
  
  // 导出模态框
  const renderExportModal = () => (
    <Modal
      title="导出辩论结果"
      open={isExportModalVisible}
      onCancel={() => setIsExportModalVisible(false)}
      footer={null}
      width={400}
    >
      <div style={{ padding: '20px 0' }}>
        <div style={{ marginBottom: '20px' }}>选择导出格式：</div>
        
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button 
            icon={<FileTextOutlined />} 
            onClick={handleExportText}
            style={{ width: '100%', textAlign: 'left', height: 'auto', padding: '10px 15px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>文本文档 (.txt)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                导出为纯文本格式，易于阅读和分享
              </div>
            </div>
          </Button>
          
          <Button 
            icon={<CopyOutlined />} 
            onClick={handleCopy}
            style={{ width: '100%', textAlign: 'left', height: 'auto', padding: '10px 15px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>复制到剪贴板</div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                复制格式化文本，可直接粘贴到其他应用
              </div>
            </div>
          </Button>
          
          <Button 
            icon={<PrinterOutlined />} 
            onClick={handlePrint}
            style={{ width: '100%', textAlign: 'left', height: 'auto', padding: '10px 15px' }}
          >
            <div>
              <div style={{ fontWeight: 'bold' }}>打印结果</div>
              <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                打开打印预览，可保存为PDF或打印
              </div>
            </div>
          </Button>
        </Space>
      </div>
    </Modal>
  );

  // 如果没有结果且不在加载中，显示空状态
  if (!result && !isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 0' }}>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="提交问题后，AI辩论结果将在这里显示"
          style={{ color: 'var(--text-light)' }}
        />
      </div>
    );
  }

  // 如果在加载中但没有结果，不显示任何内容
  if (isLoading && !result) {
    return null;
  }

  // 此时result一定不为null
  if (!result) return null;

  // 获取模型显示名称和图标
  const getModelInfo = (modelId: string) => {
    const modelInfoMap: { [key: string]: { name: string; icon: React.ReactNode; color: string; tier: string } } = {
      'deepseek': { name: 'DeepSeek Chat', icon: <RobotOutlined />, color: 'var(--primary-color)', tier: 'Pro' },
      'qwen': { name: 'Qwen (通义千问)', icon: <StarOutlined />, color: 'var(--secondary-color)', tier: 'Max' },
      'doubao': { name: 'Doubao (豆包)', icon: <RobotOutlined />, color: 'var(--tertiary-color)', tier: 'Pro' },
      'chatglm': { name: 'ChatGLM', icon: <TrophyOutlined />, color: 'var(--accent-color)', tier: 'Elite' },
      'hunyuan': { name: 'Tencent Hunyuan', icon: <RobotOutlined />, color: 'var(--primary-color)', tier: 'Premium' }
    };
    return modelInfoMap[modelId] || { 
      name: modelId, 
      icon: <RobotOutlined />, 
      color: 'var(--text-primary)', 
      tier: 'Standard' 
    };
  };

  // 自定义Markdown组件
  const MarkdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match[1]}
          PreTag="div"
          customStyle={{
            borderRadius: '12px',
            fontSize: '14px',
            margin: '16px 0',
            maxHeight: '400px',
          }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code 
          className={className} 
          style={{
            background: 'var(--bg-tertiary)',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.9em',
            color: 'var(--primary-color)'
          }}
          {...props}
        >
          {children}
        </code>
      );
    },
    h1: ({ children }: any) => (
      <Typography.Title level={2} style={{ color: 'var(--primary-color)', marginTop: '24px' }}>
        {children}
      </Typography.Title>
    ),
    h2: ({ children }: any) => (
      <Typography.Title level={3} style={{ color: 'var(--secondary-color)', marginTop: '20px' }}>
        {children}
      </Typography.Title>
    ),
    h3: ({ children }: any) => (
      <Typography.Title level={4} style={{ color: 'var(--tertiary-color)', marginTop: '16px' }}>
        {children}
      </Typography.Title>
    ),
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

  // 格式化时间戳 - 现在是字符串格式
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // 根据阶段获取图标
  const getStageIcon = (stageIndex: number) => {
    const icons = [
      <ThunderboltOutlined key="1" style={{ color: 'var(--primary-color)' }} />,
      <SyncOutlined key="2" style={{ color: 'var(--secondary-color)' }} />,
      <SafetyOutlined key="3" style={{ color: 'var(--tertiary-color)' }} />
    ];
    return icons[stageIndex] || icons[0];
  };

  // 渲染单个模型响应
  const renderModelResponse = (response: LLMResponse, index: number) => {
    const hasContent = response.content && response.content.trim().length > 0;
    const modelInfo = getModelInfo(response.model);
    
    return (
      <motion.div
        key={`${response.model}-${index}`}
        className="model-response"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
      >
        <div className="response-header">
          <div className="model-info">
            <div className="model-avatar" style={{ background: modelInfo.color }}>
              {response.model.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="model-name">{modelInfo.name}</div>
              <div className="model-provider">{modelInfo.tier}</div>
            </div>
          </div>
          <span className="response-timestamp">
            {response.timestamp ? formatTimestamp(response.timestamp) : '处理中...'}
          </span>
        </div>
        
        <div className="response-content">
          {hasContent ? (
            <ReactMarkdown 
              components={MarkdownComponents as any}
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {response.content}
            </ReactMarkdown>
          ) : (
            <Text type="secondary" style={{ fontStyle: 'italic' }}>模型响应为空，可能发生了错误。</Text>
          )}
        </div>
      </motion.div>
    );
  };

  // 渲染辩论阶段
  const renderDebateStage = (stage: DebateStage, stageIndex: number) => {
    const stageNames = [
      "初始提案阶段", 
      "交叉审视阶段", 
      "最终验证阶段"
    ];
    
    const stageName = stageNames[stageIndex] || `阶段 ${stageIndex + 1}`;
    
    return (
      <motion.div 
        key={`stage-${stageIndex}`}
        className="debate-stage"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: stageIndex * 0.1 }}
      >
        <div className="stage-header">
          <div className="stage-number">{stageIndex + 1}</div>
          <div className="stage-name">
            {stageName}
          </div>
        </div>
        <div className="stage-content">
          {stage.responses.map((response, index) => 
            renderModelResponse(response, index)
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="results-container">
      <motion.div
        className="result-title"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        辩论结果
      </motion.div>
      
      <motion.div 
        className="question-display"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <strong>问题：</strong> {result.question}
      </motion.div>
      
      {/* 显示各个阶段的辩论 */}
      <AnimatePresence>
        {result.stages.map((stage, index) => 
          renderDebateStage(stage, index)
        )}
      </AnimatePresence>
      
      {/* 总结部分 */}
      {result.summary && !isLoading && (
        <motion.div 
          className="summary-container"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="summary-header">
            <div className="summary-icon">
              <CheckCircleOutlined />
            </div>
            <div className="summary-title">辩论总结</div>
          </div>
          <div className="summary-content">
            <ReactMarkdown 
              components={MarkdownComponents as any}
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
            >
              {result.summary}
            </ReactMarkdown>
          </div>
        </motion.div>
      )}

      {/* 操作按钮 */}
      <div className="result-actions">
        <Button 
          type="primary" 
          icon={<ShareAltOutlined />} 
          onClick={handleShare}
          style={{ marginRight: '12px' }}
        >
          分享结果
        </Button>
        
        <Button 
          type="default" 
          icon={<FileDoneOutlined />} 
          onClick={() => setIsExportModalVisible(true)}
          style={{ marginRight: '12px' }}
        >
          导出结果
        </Button>
        
        <Button 
          type="default" 
          icon={isSpeaking ? <AudioOutlined /> : <AudioOutlined />} 
          onClick={handleSpeakResult}
          loading={isSpeaking}
        >
          {isSpeaking ? '停止朗读' : '语音朗读'}
        </Button>
      </div>

      {/* 导出模态框 */}
      {renderExportModal()}
    </div>
  );
};

export default ResultDisplay;

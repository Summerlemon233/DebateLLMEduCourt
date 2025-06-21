import React, { useState, useRef, useEffect } from 'react';
import { Input, Button } from 'antd';
import { SendOutlined, SearchOutlined, LoadingOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';

const { TextArea } = Input;

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  isLoading,
  placeholder = "请输入您的问题..."
}) => {
  const [question, setQuestion] = useState<string>('');
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const textAreaRef = useRef<any>(null);
  
  // 自动聚焦输入框
  useEffect(() => {
    if (textAreaRef.current && !isLoading) {
      setTimeout(() => {
        textAreaRef.current.focus();
      }, 500);
    }
  }, [isLoading]);

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question.trim());
      // 不清空输入框，让用户可以看到之前的问题
      // setQuestion('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const getCharCount = () => {
    const count = question.length;
    const max = 1000;
    const percentage = Math.round((count / max) * 100);
    
    let color = 'var(--text-light)';
    if (percentage > 80) color = '#fa8c16';
    if (percentage > 95) color = '#f5222d';
    
    return {
      count,
      max,
      color
    };
  };

  const charCount = getCharCount();

  return (
    <div className="question-input-container">
      {/* 问题输入框 */}
      <div 
        style={{ 
          position: 'relative',
          marginBottom: '20px',
          transition: 'all 0.3s ease'
        }}
      >
        <motion.div
          animate={{
            scale: isFocused ? [1, 1.02, 1] : 1,
            boxShadow: isFocused 
              ? ['0 0 0 rgba(71, 118, 230, 0)', '0 0 0 3px rgba(71, 118, 230, 0.2)', '0 0 0 rgba(71, 118, 230, 0)']
              : '0 0 0 rgba(71, 118, 230, 0)'
          }}
          transition={{ duration: 1.5, repeat: isFocused ? Infinity : 0, ease: "easeInOut" }}
          style={{ width: '100%' }}
        >
          <TextArea
            ref={textAreaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            autoSize={{ minRows: 4, maxRows: 8 }}
            className="question-input"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            maxLength={1000}
          />
        </motion.div>
      </div>
      
      {/* 提示文本 - 单独一行 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        fontSize: '0.85rem',
        color: 'var(--text-light)',
        padding: '0 5px'
      }}>
        <SearchOutlined style={{ marginRight: '6px' }} />
        提示：输入您感兴趣的话题，探索不同AI模型的观点
      </div>
      
      {/* 字符计数 - 单独一行 */}
      <div style={{ 
        textAlign: 'right',
        fontSize: '0.8rem',
        color: charCount.color,
        fontWeight: charCount.count > 800 ? 500 : 400,
        marginBottom: '16px',
        padding: '0 5px'
      }}>
        {charCount.count}/{charCount.max}
      </div>
      
      {/* 开始辩论按钮 - 单独一行 */}
      <motion.div
        whileHover={isLoading ? {} : { scale: 1.02 }}
        whileTap={isLoading ? {} : { scale: 0.98 }}
        style={{ 
          textAlign: 'center',
          marginBottom: '16px'
        }}
      >
        <Button
          type="primary"
          size="large"
          icon={isLoading ? <LoadingOutlined /> : <SendOutlined />}
          onClick={handleSubmit}
          loading={isLoading}
          disabled={!question.trim() || isLoading}
          className="submit-button"
          style={{
            minWidth: '150px',
            height: '45px',
            fontSize: '16px',
            fontWeight: 500
          }}
        >
          {isLoading ? '辩论中...' : '开始辩论'}
        </Button>
      </motion.div>
      
      {/* Ctrl+Enter 快捷键提示 - 单独一行 */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        style={{ 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          gap: '8px'
        }}
      >
        <span style={{ 
          background: 'var(--bg-tertiary)',
          padding: '4px 10px',
          borderRadius: '6px',
          fontWeight: 500,
          fontSize: '0.8rem'
        }}>
          Ctrl + Enter
        </span>
        <span>快速提交问题</span>
      </motion.div>
    </div>
  );
};

export default QuestionInput;

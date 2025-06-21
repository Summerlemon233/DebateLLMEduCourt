import React, { useState, useRef } from 'react';
import { Button, Input, message } from 'antd';
import { motion } from 'framer-motion';
import { 
  SendOutlined, 
  LoadingOutlined, 
  BulbOutlined,
  EditOutlined
} from '@ant-design/icons';

const { TextArea } = Input;

interface QuestionInputProps {
  onSubmit: (question: string) => void;
  isLoading?: boolean;
  placeholder?: string;
}

const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  isLoading = false,
  placeholder = "请输入您想要探讨的问题..."
}) => {
  const [question, setQuestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textAreaRef = useRef<any>(null);

  const handleSubmit = () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      message.warning('请输入问题内容');
      return;
    }
    
    if (trimmedQuestion.length < 5) {
      message.warning('问题长度至少需要5个字符');
      return;
    }

    onSubmit(trimmedQuestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const charCount = question.length;
  const maxLength = 1000;
  const isOverLimit = charCount > maxLength;
  const isNearLimit = charCount > maxLength * 0.8;

  return (
    <div style={{
      width: '100%',
      padding: '0',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      
      {/* 问题输入框 */}
      <div style={{
        width: '100%',
        position: 'relative'
      }}>
        <motion.div
          animate={{
            scale: isFocused ? [1, 1.01, 1] : 1
          }}
          transition={{ 
            duration: 2, 
            repeat: isFocused ? Infinity : 0, 
            ease: "easeInOut" 
          }}
        >
          <TextArea
            ref={textAreaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            autoSize={{ minRows: 4, maxRows: 8 }}
            maxLength={maxLength}
            showCount={false}
            style={{
              fontSize: '16px',
              lineHeight: '1.6',
              padding: '16px',
              borderRadius: '12px',
              border: isFocused ? '2px solid #1890ff' : '2px solid #d9d9d9',
              boxShadow: isFocused ? '0 0 0 2px rgba(24, 144, 255, 0.2)' : 'none',
              transition: 'all 0.3s ease',
              resize: 'none'
            }}
          />
        </motion.div>
      </div>

      {/* 提示信息 */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#666',
        fontSize: '14px',
        padding: '0 4px'
      }}>
        <BulbOutlined style={{ color: '#1890ff' }} />
        <span>提示：输入您感兴趣的话题，探索不同AI模型的观点</span>
      </div>

      {/* 字符计数 */}
      <div style={{
        width: '100%',
        textAlign: 'right',
        fontSize: '13px',
        color: isOverLimit ? '#ff4d4f' : isNearLimit ? '#fa8c16' : '#999',
        fontWeight: isOverLimit || isNearLimit ? 'bold' : 'normal',
        padding: '0 4px'
      }}>
        {charCount} / {maxLength}
        {isOverLimit && <span style={{ marginLeft: '8px', color: '#ff4d4f' }}>超出字数限制</span>}
      </div>

      {/* 开始辩论按钮 */}
      <div style={{
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '8px'
      }}>
        <motion.div
          whileHover={!isLoading ? { scale: 1.05 } : {}}
          whileTap={!isLoading ? { scale: 0.95 } : {}}
        >
          <Button
            type="primary"
            size="large"
            icon={isLoading ? <LoadingOutlined spin /> : <SendOutlined />}
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!question.trim() || isLoading || isOverLimit}
            style={{
              height: '48px',
              minWidth: '160px',
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isLoading ? '辩论进行中...' : '开始辩论'}
          </Button>
        </motion.div>
      </div>

      {/* Ctrl+Enter快捷键提示 */}
      <div style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#999',
        paddingTop: '4px'
      }}>
        <span style={{
          background: '#f5f5f5',
          padding: '4px 8px',
          borderRadius: '4px',
          border: '1px solid #d9d9d9',
          fontSize: '12px',
          fontFamily: 'monospace'
        }}>
          Ctrl + Enter
        </span>
        <span>快速提交问题</span>
      </div>
    </div>
  );
};

export default QuestionInput;

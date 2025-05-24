import React, { useState } from 'react';
import { Input, Button, Row, Col } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import type { QuestionInputProps } from '@/types';

const { TextArea } = Input;

const QuestionInput: React.FC<QuestionInputProps> = ({
  onSubmit,
  isLoading,
  placeholder = "请输入您的问题..."
}) => {
  const [question, setQuestion] = useState<string>('');

  const handleSubmit = () => {
    if (question.trim()) {
      onSubmit(question.trim());
      setQuestion(''); // 清空输入框
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="question-input-container">
      <Row gutter={[12, 12]} style={{ width: '100%' }}>
        <Col span={24}>
          <TextArea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={placeholder}
            disabled={isLoading}
            autoSize={{ minRows: 3, maxRows: 6 }}
            style={{
              fontSize: '16px',
              borderRadius: '8px',
              resize: 'none'
            }}
            showCount
            maxLength={1000}
          />
          <div style={{ 
            marginTop: '8px', 
            fontSize: '12px', 
            color: '#666',
            textAlign: 'right'
          }}>
            💡 提示：按 Ctrl + Enter 快速提交
          </div>
        </Col>
        <Col span={24} style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            size="large"
            icon={<SendOutlined />}
            onClick={handleSubmit}
            loading={isLoading}
            disabled={!question.trim() || isLoading}
            style={{
              minWidth: '120px',
              height: '48px',
              fontSize: '16px',
              fontWeight: 600,
            }}
          >
            {isLoading ? '辩论中...' : '开始辩论'}
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default QuestionInput;

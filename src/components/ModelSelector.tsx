import React from 'react';
import { Checkbox } from 'antd';
import { motion } from 'framer-motion';
import { CheckCircleFilled, ExperimentOutlined } from '@ant-design/icons';
import type { ModelConfig } from '../types';

interface ModelSelectorProps {
  models: ModelConfig[];
  selectedModels: string[];
  onModelChange: (selectedModels: string[]) => void;
  disabled: boolean;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModels,
  onModelChange,
  disabled
}) => {
  // 处理模型选择
  const handleModelChange = (modelId: string, checked: boolean) => {
    if (checked) {
      onModelChange([...selectedModels, modelId]);
    } else {
      onModelChange(selectedModels.filter(id => id !== modelId));
    }
  };

  // 模型提供商图标映射
  const getProviderIcon = (provider: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Google': '🟢',
      'DeepSeek': '🔵',
      'Alibaba': '🟠',
      'ByteDance': '🔴',
      'Tencent': '🟡',
      'Zhipu AI': '🟣',
      'OpenAI': '⚪',
      'Anthropic': '🟤',
    };
    return iconMap[provider] || '🤖';
  };

  // 模型卡片动画配置
  const cardVariants = {
    initial: { opacity: 0, y: 20 },
    animate: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.4,
        delay: 0.05 * i
      }
    }),
    hover: { 
      y: -5,
      boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)'
    },
    tap: { 
      y: -2,
      boxShadow: '0 5px 10px rgba(0, 0, 0, 0.1)'
    }
  };

  return (
    <div className="model-selector-container">
      <div className="model-grid">
        {models
          .filter(model => model.enabled)
          .map((model, i) => {
            const isSelected = selectedModels.includes(model.id);
            
            return (
              <motion.div
                key={model.id}
                className={`model-card ${isSelected ? 'selected' : ''}`}
                initial="initial"
                animate="animate"
                whileHover={disabled ? {} : "hover"}
                whileTap={disabled ? {} : "tap"}
                variants={cardVariants}
                custom={i}
                onClick={() => {
                  if (!disabled) {
                    handleModelChange(model.id, !isSelected);
                  }
                }}
                style={{
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  opacity: disabled ? 0.7 : 1,
                }}
              >
                <div className="model-header">
                  <div className="model-name">
                    {model.name}
                    {isSelected && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        style={{ 
                          display: 'inline-flex', 
                          marginLeft: '10px', 
                          color: 'var(--primary-color)'
                        }}
                      >
                        <CheckCircleFilled />
                      </motion.span>
                    )}
                  </div>
                  <span className="model-provider">{getProviderIcon(model.provider)} {model.provider}</span>
                </div>
                
                <p className="model-description">
                  {model.description}
                </p>
                
                <div style={{ marginTop: 'auto' }}>
                  <Checkbox
                    checked={isSelected}
                    disabled={disabled}
                    onChange={(e) => {
                      if (!disabled) {
                        handleModelChange(model.id, e.target.checked);
                      }
                    }}
                    className="model-checkbox"
                  >
                    <span style={{ 
                      fontSize: '0.85rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      {isSelected ? '已选择' : '选择此模型'}
                    </span>
                  </Checkbox>
                </div>
              </motion.div>
            );
          })}
      </div>

      {/* 选择摘要 */}
      <motion.div 
        className="selection-summary"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        style={{ 
          background: 'var(--bg-secondary)',
          padding: '15px 20px',
          borderRadius: '12px',
          marginTop: '20px',
          fontSize: '0.9rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
      >
        <ExperimentOutlined style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }} />
        <span>
          <strong>当前配置：</strong>
          {selectedModels.length > 0 ? (
            `已选择 ${selectedModels.length} 个AI模型参与辩论${selectedModels.length < 2 ? ' (至少需要2个)' : ''}`
          ) : (
            '请选择至少2个AI模型开始辩论'
          )}
        </span>
      </motion.div>
    </div>
  );
};

export default ModelSelector;

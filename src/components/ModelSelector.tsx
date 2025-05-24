import React from 'react';
import { Card, Checkbox, Select, Row, Col, Typography, Badge, Tooltip } from 'antd';
import { 
  RobotOutlined, 
  CheckCircleOutlined, 
  ExperimentOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import type { ModelSelectorProps } from '@/types';

const { Title, Text } = Typography;
const { Option } = Select;

const ModelSelector: React.FC<ModelSelectorProps> = ({
  models,
  selectedModels,
  verifierModel,
  onModelChange,
  onVerifierChange,
  disabled
}) => {
  // 处理辩论模型选择
  const handleDebaterChange = (checkedModels: string[]) => {
    onModelChange(checkedModels);
  };

  // 获取可用的验证者模型
  const getVerifierOptions = () => {
    return models
      .filter(model => model.isVerifier && selectedModels.includes(model.id))
      .map(model => ({
        value: model.id,
        label: model.name,
      }));
  };

  // 模型提供商图标映射
  const getProviderIcon = (provider: string) => {
    const iconMap: { [key: string]: React.ReactNode } = {
      'Google': '🟢',
      'DeepSeek': '🔵',
      'Alibaba': '🟠',
      'ByteDance': '🔴',
      'Tencent': '🟡',
      'Zhipu': '🟣',
    };
    return iconMap[provider] || <RobotOutlined />;
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: '20px', color: '#333' }}>
        <ExperimentOutlined style={{ marginRight: '8px', color: '#4facfe' }} />
        选择参与辩论的AI模型
      </Title>

      {/* 辩论模型选择 */}
      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
          辩论参与者 (至少选择2个)
        </Text>
        <Row gutter={[16, 16]}>
          {models
            .filter(model => model.isDebater)
            .map(model => (
              <Col xs={24} sm={12} lg={8} key={model.id}>
                <Card
                  size="small"
                  hoverable={!disabled}
                  className={selectedModels.includes(model.id) ? 'model-card selected' : 'model-card'}
                  style={{
                    border: selectedModels.includes(model.id) 
                      ? '2px solid #4facfe' 
                      : '2px solid #e1e5e9',
                    background: selectedModels.includes(model.id) ? '#f0f9ff' : 'white',
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                  onClick={() => {
                    if (!disabled) {
                      const newSelected = selectedModels.includes(model.id)
                        ? selectedModels.filter(id => id !== model.id)
                        : [...selectedModels, model.id];
                      handleDebaterChange(newSelected);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Checkbox
                      checked={selectedModels.includes(model.id)}
                      disabled={disabled}
                      style={{ marginTop: '2px' }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {getProviderIcon(model.provider)}
                        <Text strong style={{ fontSize: '14px' }}>
                          {model.name}
                        </Text>
                        {model.enabled && (
                          <Badge 
                            status="success" 
                            text="可用" 
                            style={{ fontSize: '12px' }}
                          />
                        )}
                      </div>
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: '12px', 
                          lineHeight: '1.4',
                          display: 'block'
                        }}
                      >
                        {model.description}
                      </Text>
                      <div style={{ marginTop: '6px', fontSize: '11px', color: '#999' }}>
                        {model.provider} • {model.maxTokens} tokens
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
        </Row>
      </div>

      {/* 验证者模型选择 */}
      <div>
        <Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
          <SafetyOutlined style={{ marginRight: '6px', color: '#52c41a' }} />
          最终验证者
        </Text>
        <Text 
          type="secondary" 
          style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}
        >
          选择一个模型来综合所有辩论结果并提供最终答案
        </Text>
        
        <Select
          value={verifierModel}
          onChange={onVerifierChange}
          disabled={disabled || getVerifierOptions().length === 0}
          style={{ width: '100%', maxWidth: '400px' }}
          size="large"
          placeholder="选择验证者模型"
        >
          {getVerifierOptions().map(option => {
            const model = models.find(m => m.id === option.value);
            return (
              <Option key={option.value} value={option.value}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {model && getProviderIcon(model.provider)}
                  <span>{option.label}</span>
                  <CheckCircleOutlined style={{ color: '#52c41a', marginLeft: 'auto' }} />
                </div>
              </Option>
            );
          })}
        </Select>

        {getVerifierOptions().length === 0 && (
          <div style={{ marginTop: '8px' }}>
            <Text type="warning" style={{ fontSize: '12px' }}>
              ⚠️ 请先选择至少一个支持验证功能的辩论模型
            </Text>
          </div>
        )}
      </div>

      {/* 选择摘要 */}
      <div style={{ 
        marginTop: '20px', 
        padding: '12px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e1e5e9'
      }}>
        <Text style={{ fontSize: '13px', color: '#666' }}>
          <strong>当前配置：</strong>
          {selectedModels.length > 0 ? (
            <>
              {selectedModels.length} 个辩论者参与讨论，
              由 {models.find(m => m.id === verifierModel)?.name || '未选择'} 作为最终验证者
            </>
          ) : (
            '请选择辩论参与者'
          )}
        </Text>
      </div>
    </div>
  );
};

export default ModelSelector;

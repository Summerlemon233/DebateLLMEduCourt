import React from 'react';
import { Card, Checkbox, Row, Col, Typography, Badge } from 'antd';
import { 
  RobotOutlined, 
  ExperimentOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ModelSelectorProps {
  models: Array<{
    id: string;
    name: string;
    provider: string;
    description: string;
    enabled: boolean;
    maxTokens?: number;
  }>;
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
    };
    return iconMap[provider] || <RobotOutlined />;
  };

  return (
    <div>
      <Title level={3} style={{ marginBottom: '20px', color: '#333' }}>
        <ExperimentOutlined style={{ marginRight: '8px', color: '#4facfe' }} />
        选择参与辩论的AI模型
      </Title>

      {/* 模型选择区域 */}
      <div style={{ marginBottom: '24px' }}>
        <Text strong style={{ fontSize: '16px', marginBottom: '12px', display: 'block' }}>
          辩论参与者 (至少选择2个)
        </Text>
        <Row gutter={[16, 16]}>
          {models
            .filter(model => model.enabled)
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
                      handleModelChange(model.id, !selectedModels.includes(model.id));
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <Checkbox
                      checked={selectedModels.includes(model.id)}
                      disabled={disabled}
                      style={{ marginTop: '2px' }}
                      onChange={(e) => {
                        if (!disabled) {
                          handleModelChange(model.id, e.target.checked);
                        }
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {getProviderIcon(model.provider)}
                        <Text strong style={{ fontSize: '14px' }}>
                          {model.name}
                        </Text>
                        <Badge 
                          status="success" 
                          text="可用" 
                          style={{ fontSize: '12px' }}
                        />
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
                        {model.provider}{model.maxTokens ? ` • ${model.maxTokens} tokens` : ''}
                      </div>
                    </div>
                  </div>
                </Card>
              </Col>
            ))}
        </Row>
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
            `已选择 ${selectedModels.length} 个AI模型参与辩论`
          ) : (
            '请选择至少2个AI模型开始辩论'
          )}
        </Text>
      </div>
    </div>
  );
};

export default ModelSelector;

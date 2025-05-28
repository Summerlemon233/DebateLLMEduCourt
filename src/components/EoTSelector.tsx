import React from 'react';
import { Card, Radio, Typography, Space, Tooltip } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';
import type { EoTStrategy, EoTStrategyConfig } from '@/types';

const { Title, Text } = Typography;

interface EoTSelectorProps {
  selectedStrategy: EoTStrategy;
  onStrategyChange: (strategy: EoTStrategy) => void;
  disabled?: boolean;
}

// EoT策略配置
const EoT_STRATEGIES: EoTStrategyConfig[] = [
  {
    strategy: 'debate',
    name: '辩论型 (Debate)',
    description: '完全连通的辩论模式，所有模型相互质疑和讨论，适合需要多角度思辨的复杂问题',
    stages: 3,
    communicationPattern: '完全连通图 - 每个模型都与其他所有模型进行交流'
  },
  {
    strategy: 'memory',
    name: '内存型 (Memory/Bus)',
    description: '总线型共享内存模式，所有模型共享一个统一的知识库进行推理，适合需要整合大量信息的问题',
    stages: 3,
    communicationPattern: '总线拓扑 - 通过共享内存池进行信息交换'
  },
  {
    strategy: 'report',
    name: '汇报型 (Report/Star)',
    description: '星型中心化模式，外围模型向中心模型汇报，由中心模型统一分析和指导，适合需要权威决策的问题',
    stages: 3,
    communicationPattern: '星型拓扑 - 中心节点协调所有外围节点'
  },
  {
    strategy: 'relay',
    name: '接力型 (Relay/Ring)',
    description: '环型接力推理模式，模型按顺序接力思考，逐步深化分析，适合需要渐进式推理的问题',
    stages: 2,
    communicationPattern: '环型拓扑 - 信息按顺序在节点间传递'
  }
];

/**
 * EoT策略选择器组件
 * 让用户选择不同的Exchange-of-Thought通信范式
 */
const EoTSelector: React.FC<EoTSelectorProps> = ({
  selectedStrategy,
  onStrategyChange,
  disabled = false
}) => {
  return (
    <Card 
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            选择 EoT 策略
          </Title>
          <Tooltip title="Exchange-of-Thought是一种多模型协作推理框架，通过不同的通信拓扑实现模型间的知识交换">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
        </Space>
      }
      style={{ marginBottom: '24px' }}
    >
      <Radio.Group
        value={selectedStrategy}
        onChange={(e) => onStrategyChange(e.target.value)}
        disabled={disabled}
        style={{ width: '100%' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {EoT_STRATEGIES.map((strategy) => (
            <Radio 
              key={strategy.strategy} 
              value={strategy.strategy}
              style={{ 
                width: '100%', 
                padding: '12px',
                border: selectedStrategy === strategy.strategy ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderRadius: '8px',
                backgroundColor: selectedStrategy === strategy.strategy ? '#f6ffed' : '#fafafa',
                display: 'flex',
                alignItems: 'flex-start'
              }}
            >
              <div style={{ 
                marginLeft: '8px', 
                width: '100%',
                wordWrap: 'break-word',
                overflow: 'hidden'
              }}>
                <div style={{ marginBottom: '4px' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    {strategy.name}
                  </Text>
                  <Text type="secondary" style={{ marginLeft: '8px' }}>
                    ({strategy.stages} 阶段)
                  </Text>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <Text style={{ 
                    display: 'block',
                    lineHeight: '1.5',
                    wordBreak: 'break-word'
                  }}>
                    {strategy.description}
                  </Text>
                </div>
                <div>
                  <Text type="secondary" style={{ 
                    fontSize: '12px',
                    display: 'block',
                    lineHeight: '1.4',
                    wordBreak: 'break-word'
                  }}>
                    <strong>通信模式：</strong>{strategy.communicationPattern}
                  </Text>
                </div>
              </div>
            </Radio>
          ))}
        </Space>
      </Radio.Group>

      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '6px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          <strong>提示：</strong>
          不同的EoT策略适用于不同类型的问题。
          <strong>辩论型</strong>适合争议性话题，
          <strong>内存型</strong>适合信息整合，
          <strong>汇报型</strong>适合需要权威指导的问题，
          <strong>接力型</strong>适合需要逐步深化的复杂推理。
        </Text>
      </div>
    </Card>
  );
};

export default EoTSelector;

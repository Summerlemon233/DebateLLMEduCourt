import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Timeline, Tag, Avatar, Progress, Typography, Tooltip } from 'antd';
import { 
  RobotOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';

const { Title, Text } = Typography;

interface Agent {
  id: string;
  name: string;
  type: string;
  status: 'idle' | 'working' | 'completed' | 'error';
  progress: number;
  contribution?: string;
  icon: string;
  color: string;
}

interface CollaborationStep {
  id: string;
  name: string;
  agentId: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  startTime?: Date;
  endTime?: Date;
  output?: string;
  dependencies: string[];
}

interface AgentCollaborationViewProps {
  agents: Agent[];
  steps: CollaborationStep[];
  isActive: boolean;
  onStepComplete?: (stepId: string, output: string) => void;
}

export const AgentCollaborationView: React.FC<AgentCollaborationViewProps> = ({
  agents,
  steps,
  isActive,
  onStepComplete
}) => {
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  // 模拟步骤执行
  useEffect(() => {
    if (!isActive || steps.length === 0) return;

    const executeSteps = async () => {
      for (const step of steps) {
        // 检查依赖是否完成
        const dependenciesCompleted = step.dependencies.every(dep => 
          completedSteps.has(dep)
        );

        if (!dependenciesCompleted && step.dependencies.length > 0) {
          continue;
        }

        setCurrentStep(step.id);
        
        // 模拟执行时间
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        setCompletedSteps(prev => new Set([...prev, step.id]));
        
        if (onStepComplete) {
          onStepComplete(step.id, `${step.name}的输出结果`);
        }
      }
      
      setCurrentStep(null);
    };

    executeSteps();
  }, [isActive, steps, onStepComplete]);

  const getStepStatus = (step: CollaborationStep): 'wait' | 'process' | 'finish' | 'error' => {
    if (completedSteps.has(step.id)) return 'finish';
    if (currentStep === step.id) return 'process';
    return 'wait';
  };

  const getStepIcon = (step: CollaborationStep) => {
    const status = getStepStatus(step);
    const agent = agents.find(a => a.id === step.agentId);
    
    switch (status) {
      case 'finish':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'process':
        return <LoadingOutlined style={{ color: '#1890ff' }} />;
      case 'error':
        return <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />;
      default:
        return (
          <Avatar 
            size="small" 
            style={{ 
              backgroundColor: agent?.color || '#d9d9d9',
              fontSize: 12
            }}
          >
            {agent?.icon || '🤖'}
          </Avatar>
        );
    }
  };

  const calculateOverallProgress = (): number => {
    if (steps.length === 0) return 0;
    return Math.round((completedSteps.size / steps.length) * 100);
  };

  return (
    <div className="agent-collaboration-view">
      <Row gutter={[24, 24]}>
        {/* 智能体状态面板 */}
        <Col xs={24} lg={8}>
          <Card title="智能体状态" size="small">
            <div className="agents-grid">
              {agents.map((agent) => {
                const isCurrentlyWorking = steps.some(
                  step => step.agentId === agent.id && currentStep === step.id
                );
                const hasCompleted = steps.some(
                  step => step.agentId === agent.id && completedSteps.has(step.id)
                );

                return (
                  <motion.div
                    key={agent.id}
                    className="agent-card"
                    style={{
                      padding: 12,
                      border: `2px solid ${isCurrentlyWorking ? agent.color : '#f0f0f0'}`,
                      borderRadius: 8,
                      marginBottom: 12,
                      backgroundColor: isCurrentlyWorking ? `${agent.color}10` : '#fafafa',
                    }}
                    animate={{
                      scale: isCurrentlyWorking ? 1.02 : 1,
                      boxShadow: isCurrentlyWorking ? 
                        `0 4px 12px ${agent.color}30` : 
                        '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Avatar 
                        style={{ backgroundColor: agent.color }}
                        size="small"
                      >
                        {agent.icon}
                      </Avatar>
                      <div style={{ flex: 1 }}>
                        <Text strong style={{ fontSize: 12 }}>
                          {agent.name}
                        </Text>
                        <div>
                          <Tag 
                            color={
                              isCurrentlyWorking ? 'processing' :
                              hasCompleted ? 'success' : 'default'
                            }
                            style={{ fontSize: 10, margin: 0 }}
                          >
                            {isCurrentlyWorking ? '工作中' :
                             hasCompleted ? '已完成' : '待命'}
                          </Tag>
                        </div>
                      </div>
                      {isCurrentlyWorking && (
                        <LoadingOutlined style={{ color: agent.color }} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </Col>

        {/* 协作流程时间线 */}
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>协作流程</span>
                <div>
                  <Text type="secondary" style={{ marginRight: 16 }}>
                    总体进度: {calculateOverallProgress()}%
                  </Text>
                  <Progress 
                    percent={calculateOverallProgress()} 
                    size="small" 
                    style={{ width: 100 }}
                  />
                </div>
              </div>
            }
            size="small"
          >
            <Timeline mode="left">
              {steps.map((step, index) => {
                const agent = agents.find(a => a.id === step.agentId);
                const status = getStepStatus(step);
                const isCurrentlyRunning = currentStep === step.id;

                return (
                  <Timeline.Item
                    key={step.id}
                    dot={getStepIcon(step)}
                    color={
                      status === 'finish' ? 'green' :
                      status === 'process' ? 'blue' :
                      status === 'error' ? 'red' : 'gray'
                    }
                  >
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>{step.name}</Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={agent?.color} style={{ fontSize: 11 }}>
                            {agent?.icon} {agent?.name}
                          </Tag>
                          {isCurrentlyRunning && (
                            <Tag color="processing" style={{ fontSize: 11 }}>
                              <ClockCircleOutlined /> 进行中
                            </Tag>
                          )}
                          {completedSteps.has(step.id) && (
                            <Tag color="success" style={{ fontSize: 11 }}>
                              <CheckCircleOutlined /> 已完成
                            </Tag>
                          )}
                        </div>
                      </div>

                      {/* 依赖关系 */}
                      {step.dependencies.length > 0 && (
                        <div style={{ marginTop: 8, marginBottom: 8 }}>
                          <Text type="secondary" style={{ fontSize: 11 }}>
                            依赖: {step.dependencies.join(', ')}
                          </Text>
                        </div>
                      )}

                      {/* 进度条 */}
                      {isCurrentlyRunning && (
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: '100%' }}
                          transition={{ duration: 2 }}
                        >
                          <Progress 
                            percent={100} 
                            size="small" 
                            status="active"
                            strokeColor={{
                              '0%': '#108ee9',
                              '100%': '#87d068',
                            }}
                          />
                        </motion.div>
                      )}

                      {/* 输出结果 */}
                      <AnimatePresence>
                        {completedSteps.has(step.id) && step.output && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                              marginTop: 8,
                              padding: 8,
                              backgroundColor: '#f6ffed',
                              border: '1px solid #b7eb8f',
                              borderRadius: 4,
                            }}
                          >
                            <Text style={{ fontSize: 11, color: '#389e0d' }}>
                              ✓ 输出: {step.output}
                            </Text>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Timeline.Item>
                );
              })}
            </Timeline>
          </Card>
        </Col>
      </Row>

      {/* 协作网络图 */}
      <Row style={{ marginTop: 24 }}>
        <Col span={24}>
          <Card title="智能体协作网络" size="small">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              minHeight: 200,
              position: 'relative'
            }}>
              {/* 中心节点 */}
              <motion.div
                style={{
                  position: 'absolute',
                  zIndex: 10,
                }}
                animate={{ rotate: isActive ? 360 : 0 }}
                transition={{ duration: 8, repeat: isActive ? Infinity : 0, ease: "linear" }}
              >
                <Avatar 
                  size={64}
                  style={{ 
                    backgroundColor: '#1890ff',
                    fontSize: 20,
                  }}
                >
                  🧠
                </Avatar>
                <Text 
                  style={{ 
                    position: 'absolute',
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: 12,
                    marginTop: 4,
                    whiteSpace: 'nowrap'
                  }}
                >
                  协调中心
                </Text>
              </motion.div>

              {/* 环绕的智能体 */}
              {agents.map((agent, index) => {
                const angle = (index * 360) / agents.length;
                const radius = 120;
                const x = Math.cos((angle * Math.PI) / 180) * radius;
                const y = Math.sin((angle * Math.PI) / 180) * radius;
                
                const isActive = steps.some(
                  step => step.agentId === agent.id && currentStep === step.id
                );

                return (
                  <motion.div
                    key={agent.id}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      transform: `translate(${x - 24}px, ${y - 24}px)`,
                    }}
                    animate={{
                      scale: isActive ? 1.2 : 1,
                      opacity: isActive ? 1 : 0.7,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <Tooltip title={agent.name}>
                      <Avatar 
                        size={48}
                        style={{ 
                          backgroundColor: agent.color,
                          border: isActive ? `3px solid ${agent.color}` : '2px solid #f0f0f0',
                          boxShadow: isActive ? `0 0 20px ${agent.color}60` : 'none',
                        }}
                      >
                        {agent.icon}
                      </Avatar>
                    </Tooltip>
                    
                    {/* 连接线 */}
                    <svg
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        zIndex: -1,
                        pointerEvents: 'none',
                      }}
                      width={Math.abs(x) * 2 + 48}
                      height={Math.abs(y) * 2 + 48}
                    >
                      <line
                        x1={x > 0 ? 0 : Math.abs(x) * 2 + 48}
                        y1={y > 0 ? 0 : Math.abs(y) * 2 + 48}
                        x2={x > 0 ? Math.abs(x) * 2 + 48 : 0}
                        y2={y > 0 ? Math.abs(y) * 2 + 48 : 0}
                        stroke={isActive ? agent.color : '#d9d9d9'}
                        strokeWidth={isActive ? 3 : 1}
                        strokeDasharray={isActive ? '5,5' : 'none'}
                        opacity={isActive ? 1 : 0.3}
                      />
                    </svg>
                  </motion.div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        .agent-collaboration-view .ant-timeline-item-content {
          min-height: auto;
        }
        
        .agents-grid {
          max-height: 400px;
          overflow-y: auto;
        }
      `}</style>
    </div>
  );
};

export default AgentCollaborationView;

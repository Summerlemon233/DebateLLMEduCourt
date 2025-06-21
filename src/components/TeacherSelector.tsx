import React, { useState, useEffect } from 'react';
import { Card, Select, Avatar, Tag, Tooltip, Space, Typography, Button, Modal } from 'antd';
import { InfoCircleOutlined, SwapOutlined, BookOutlined } from '@ant-design/icons';
import {
  TeacherPersona,
  TeacherSelectionState,
  getAllTeacherPersonas,
  getTeacherPersonaById,
  saveTeacherSelection,
  loadTeacherSelection,
  getRandomTeacherPersona
} from '@/utils/teacherPersonas';
import type { ModelConfig } from '@/types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface TeacherSelectorProps {
  models: ModelConfig[];
  selectedModels: string[];
  onTeacherSelectionChange: (selection: TeacherSelectionState) => void;
  disabled?: boolean;
}

interface TeacherDetailModalProps {
  teacher: TeacherPersona | null;
  visible: boolean;
  onClose: () => void;
}

// 教师详情模态框
const TeacherDetailModal: React.FC<TeacherDetailModalProps> = ({
  teacher,
  visible,
  onClose
}) => {
  if (!teacher) return null;

  return (
    <Modal
      title={
        <Space>
          <Avatar size="large" style={{ backgroundColor: teacher.color }}>
            {teacher.avatar}
          </Avatar>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              {teacher.name}
            </Title>
            <Text type="secondary">{teacher.background}</Text>
          </div>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          了解了
        </Button>
      ]}
      width={600}
    >
      <div style={{ padding: '16px 0' }}>
        {/* 名言 */}
        <Card size="small" style={{ marginBottom: 16, backgroundColor: '#f6f8fa' }}>
          <Text italic>"{teacher.catchphrase}"</Text>
        </Card>

        {/* 教学风格 */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>🎯 教学风格</Title>
          <Paragraph>{teacher.teachingStyle}</Paragraph>
        </div>

        {/* 专长领域 */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>📚 专长领域</Title>
          <Space wrap>
            {teacher.specialty.map((spec, index) => (
              <Tag key={index} color={teacher.color}>
                {spec}
              </Tag>
            ))}
          </Space>
        </div>

        {/* 性格特点 */}
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>✨ 性格特点</Title>
          <Space wrap>
            {teacher.personality.map((trait, index) => (
              <Tag key={index} color="blue">
                {trait}
              </Tag>
            ))}
          </Space>
        </div>
      </div>
    </Modal>
  );
};

const TeacherSelector: React.FC<TeacherSelectorProps> = ({
  models,
  selectedModels,
  onTeacherSelectionChange,
  disabled = false
}) => {
  const [teacherSelection, setTeacherSelection] = useState<TeacherSelectionState>({});
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherPersona | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const allTeachers = getAllTeacherPersonas();

  // 加载本地存储的教师选择
  useEffect(() => {
    const savedSelection = loadTeacherSelection();
    setTeacherSelection(savedSelection);
    onTeacherSelectionChange(savedSelection);
  }, []);

  // 处理教师选择变化
  const handleTeacherChange = (modelId: string, teacherPersonaId: string) => {
    const newSelection = {
      ...teacherSelection,
      [modelId]: teacherPersonaId
    };
    
    setTeacherSelection(newSelection);
    saveTeacherSelection(newSelection);
    onTeacherSelectionChange(newSelection);
  };

  // 随机分配教师
  const randomAssignTeachers = () => {
    const newSelection: TeacherSelectionState = {};
    selectedModels.forEach(modelId => {
      const randomTeacher = getRandomTeacherPersona();
      newSelection[modelId] = randomTeacher.id;
    });
    
    setTeacherSelection(newSelection);
    saveTeacherSelection(newSelection);
    onTeacherSelectionChange(newSelection);
  };

  // 显示教师详情
  const showTeacherDetail = (teacherId: string) => {
    const teacher = getTeacherPersonaById(teacherId);
    setSelectedTeacher(teacher);
    setModalVisible(true);
  };

  // 获取启用的模型
  const enabledModels = models.filter(model => 
    selectedModels.includes(model.id)
  );

  return (
    <div className="teacher-selector">
      <div style={{ marginBottom: 16 }}>
        <Space align="center">
          <Title level={4} style={{ margin: 0 }}>
            👨‍🏫 选择AI教师人格
          </Title>
          <Tooltip title="为每个AI模型选择不同的教师人格，让它们以不同的教学风格参与辩论">
            <InfoCircleOutlined style={{ color: '#1890ff' }} />
          </Tooltip>
          <Button
            type="dashed"
            icon={<SwapOutlined />}
            onClick={randomAssignTeachers}
            disabled={disabled || selectedModels.length === 0}
            size="small"
          >
            随机分配
          </Button>
        </Space>
      </div>

      {selectedModels.length === 0 ? (
        <Card>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <BookOutlined style={{ fontSize: 48, color: '#d9d9d9', marginBottom: 16 }} />
            <Paragraph type="secondary">
              请先选择参与辩论的AI模型，然后为每个模型选择教师人格
            </Paragraph>
          </div>
        </Card>
      ) : (
        <div className="teacher-assignment-grid">
          {enabledModels.map(model => {
            const selectedTeacherId = teacherSelection[model.id];
            const selectedTeacher = selectedTeacherId ? getTeacherPersonaById(selectedTeacherId) : null;

            return (
              <Card
                key={model.id}
                size="small"
                title={
                  <Space>
                    <Avatar size="small" style={{ backgroundColor: '#1890ff' }}>
                      {model.name.charAt(0)}
                    </Avatar>
                    <span>{model.name}</span>
                  </Space>
                }
                extra={
                  selectedTeacher && (
                    <Button
                      type="text"
                      size="small"
                      icon={<InfoCircleOutlined />}
                      onClick={() => showTeacherDetail(selectedTeacher.id)}
                    >
                      详情
                    </Button>
                  )
                }
                style={{ marginBottom: 12 }}
              >
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择教师人格"
                  value={selectedTeacherId}
                  onChange={(value) => handleTeacherChange(model.id, value)}
                  disabled={disabled}
                  size="middle"
                >
                  {allTeachers.map(teacher => (
                    <Option key={teacher.id} value={teacher.id}>
                      <Space>
                        <Avatar 
                          size="small" 
                          style={{ backgroundColor: teacher.color }}
                        >
                          {teacher.avatar}
                        </Avatar>
                        <span>{teacher.name}</span>
                        <Tag color={teacher.color}>
                          {teacher.specialty[0]}
                        </Tag>
                      </Space>
                    </Option>
                  ))}
                </Select>
                
                {selectedTeacher && (
                  <div style={{ marginTop: 8 }}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {selectedTeacher.teachingStyle.slice(0, 50)}...
                    </Text>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* 教师详情模态框 */}
      <TeacherDetailModal
        teacher={selectedTeacher}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />

      <style jsx>{`
        .teacher-selector {
          margin-bottom: 24px;
        }
        
        .teacher-assignment-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 12px;
        }
        
        @media (max-width: 768px) {
          .teacher-assignment-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default TeacherSelector;

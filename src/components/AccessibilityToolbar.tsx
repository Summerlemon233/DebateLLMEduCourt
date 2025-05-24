import React, { useState } from 'react';
import { Tooltip } from 'antd';
import { motion } from 'framer-motion';
import { 
  EyeOutlined, 
  FontSizeOutlined,
  FullscreenOutlined,
  SoundOutlined
} from '@ant-design/icons';

interface AccessibilityToolbarProps {
  currentTheme: string;
  onThemeChange: (theme: string) => void;
}

const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({ 
  currentTheme,
  onThemeChange
}) => {
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'x-large'>('normal');
  const [isHighContrast, setIsHighContrast] = useState(false);
  const [isToolbarOpen, setIsToolbarOpen] = useState(false);
  
  // 切换字体大小
  const toggleFontSize = () => {
    const sizes: Array<'normal' | 'large' | 'x-large'> = ['normal', 'large', 'x-large'];
    const currentIndex = sizes.indexOf(fontSize);
    const nextIndex = (currentIndex + 1) % sizes.length;
    
    setFontSize(sizes[nextIndex]);
    
    // 应用字体大小
    document.documentElement.style.setProperty(
      '--base-font-size', 
      fontSize === 'normal' ? '16px' : fontSize === 'large' ? '18px' : '20px'
    );
  };
  
  // 切换高对比度模式
  const toggleHighContrast = () => {
    setIsHighContrast(!isHighContrast);
    
    if (!isHighContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  };
  
  // 朗读页面功能（简单实现）
  const speakPage = () => {
    if ('speechSynthesis' in window) {
      // 获取页面主要内容
      const mainContent = document.querySelector('.app-content')?.textContent || '';
      
      // 创建语音实例
      const utterance = new SpeechSynthesisUtterance(mainContent);
      utterance.lang = 'zh-CN';
      
      // 朗读内容
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的浏览器不支持语音合成功能');
    }
  };
  
  return (
    <motion.div 
      className="accessibility-toolbar"
      initial={{ opacity: 0, x: 100 }}
      animate={{ 
        opacity: 1, 
        x: isToolbarOpen ? 0 : 70
      }}
      transition={{ duration: 0.3 }}
    >
      <div 
        className="toolbar-toggle"
        onClick={() => setIsToolbarOpen(!isToolbarOpen)}
      >
        <EyeOutlined />
        <span className="toolbar-label">
          {isToolbarOpen ? '关闭辅助工具' : '辅助'}
        </span>
      </div>
      
      {isToolbarOpen && (
        <div className="toolbar-options">
          <Tooltip title="调整字体大小">
            <div 
              className="toolbar-option"
              onClick={toggleFontSize}
            >
              <FontSizeOutlined />
              <span className="option-label">{
                fontSize === 'normal' ? '标准字体' : 
                fontSize === 'large' ? '大字体' : '超大字体'
              }</span>
            </div>
          </Tooltip>
          
          <Tooltip title="高对比度模式">
            <div 
              className={`toolbar-option ${isHighContrast ? 'active' : ''}`}
              onClick={toggleHighContrast}
            >
              <FullscreenOutlined />
              <span className="option-label">
                {isHighContrast ? '正常对比度' : '高对比度'}
              </span>
            </div>
          </Tooltip>
          
          <Tooltip title="朗读页面">
            <div 
              className="toolbar-option"
              onClick={speakPage}
            >
              <SoundOutlined />
              <span className="option-label">朗读页面</span>
            </div>
          </Tooltip>
        </div>
      )}
    </motion.div>
  );
};

export default AccessibilityToolbar;

import React from 'react';
import { Tooltip } from 'antd';
import { motion } from 'framer-motion';
import { RobotOutlined, BulbOutlined, BgColorsOutlined } from '@ant-design/icons';

interface HeaderProps {
  toggleTheme: () => void;
  currentTheme: string;
  isPageLoaded: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleTheme, currentTheme, isPageLoaded }) => {
  return (
    <motion.div 
      className="header-content"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.5 }}
    >
      <div className="logo-container">
        <motion.div 
          className="logo-icon"
          whileHover={{ scale: 1.05, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
        >
          <RobotOutlined />
        </motion.div>
        
        <Tooltip title="点击切换主题颜色">
          <motion.div 
            className="theme-toggle"
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={toggleTheme}
            style={{ 
              cursor: 'pointer',
              position: 'absolute',
              right: '30px',
              top: '30px',
              background: 'rgba(255, 255, 255, 0.2)',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
          >
            <BgColorsOutlined style={{ fontSize: '18px' }} />
          </motion.div>
        </Tooltip>
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            AI思辨场：多模型激荡智慧
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <BulbOutlined style={{ marginRight: '10px' }} />
            跨越单一视角，在AI的深度对话中探寻更优解
          </motion.p>
        </div>
      </div>
      
      {/* 移动设备导航按钮 */}
      <motion.div
        className="mobile-nav-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: isPageLoaded ? 1 : 0 }}
        transition={{ delay: 1.2 }}
      >
        <div className="scroll-indicator">
          <div className="scroll-arrow"></div>
          <span>向下滚动查看</span>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Header;

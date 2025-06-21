import React, { useState } from 'react';
import { startDebateWithRealProgress } from '@/utils/api';
import { DebateRequest } from '@/types';

const SSETestPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ stage: '', progress: 0, model: '' });

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1];
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    setLogs(prev => [...prev, logMessage]);
  };

  const testSSEConnection = async () => {
    setIsLoading(true);
    setLogs([]);
    addLog('🚀 开始测试SSE连接...');

    const testRequest: DebateRequest = {
      question: 'SSE连接测试：人工智能的发展是利大于弊还是弊大于利？',
      models: ['deepseek', 'qwen']
    };

    const handleStageUpdate = (stage: 'initial' | 'refined' | 'final', progress: number, currentModel?: string, message?: string) => {
      addLog(`📊 Stage Update: ${stage} - ${progress}% - ${currentModel || 'N/A'} - ${message || ''}`);
      setProgress({ stage, progress, model: currentModel || '' });
    };

    try {
      addLog('📤 调用 startDebateWithRealProgress...');
      const result = await startDebateWithRealProgress(testRequest, handleStageUpdate);
      addLog('✅ SSE测试成功完成！');
      addLog(`📋 结果: ${JSON.stringify(result, null, 2)}`);
    } catch (error) {
      addLog(`❌ SSE测试失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    setProgress({ stage: '', progress: 0, model: '' });
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>SSE连接测试页面</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testSSEConnection} 
          disabled={isLoading}
          style={{ 
            padding: '10px 20px', 
            marginRight: '10px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? '测试中...' : '开始SSE测试'}
        </button>
        
        <button 
          onClick={clearLogs}
          style={{ 
            padding: '10px 20px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          清空日志
        </button>
      </div>

      {progress.stage && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          border: '1px solid #dee2e6',
          borderRadius: '4px'
        }}>
          <h3>当前进度</h3>
          <p><strong>阶段:</strong> {progress.stage}</p>
          <p><strong>进度:</strong> {progress.progress}%</p>
          <p><strong>模型:</strong> {progress.model || 'N/A'}</p>
          
          <div style={{ 
            width: '100%', 
            height: '20px', 
            backgroundColor: '#e9ecef', 
            borderRadius: '10px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${progress.progress}%`,
              height: '100%',
              backgroundColor: '#28a745',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )}

      <div style={{ 
        height: '400px', 
        overflow: 'auto', 
        border: '1px solid #ccc', 
        padding: '10px',
        backgroundColor: '#f8f9fa',
        borderRadius: '4px'
      }}>
        <h3>调试日志</h3>
        {logs.length === 0 ? (
          <p style={{ color: '#6c757d' }}>点击&quot;开始SSE测试&quot;查看调试日志...</p>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={{ 
              marginBottom: '5px', 
              fontSize: '12px',
              color: log.includes('❌') ? 'red' : log.includes('✅') ? 'green' : log.includes('📊') ? 'blue' : 'black'
            }}>
              {log}
            </div>
          ))
        )}
      </div>

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#6c757d' }}>
        <p><strong>说明:</strong></p>
        <p>• 此页面用于测试SSE连接和调试进度更新问题</p>
        <p>• 所有调试信息会同时显示在浏览器控制台和上方日志区域</p>
        <p>• 如果SSE连接正常，应该能看到实时的进度更新</p>
      </div>
    </div>
  );
};

export default SSETestPage;

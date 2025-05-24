import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  color: string;
  opacity: number;
}

interface ParticleBackgroundProps {
  color?: string;
}

const ParticleBackground: React.FC<ParticleBackgroundProps> = ({ color = 'rgba(255, 255, 255, 0.5)' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationFrameId = useRef<number>(0);
  
  // 初始化粒子系统
  const initParticles = (width: number, height: number) => {
    const particleCount = Math.min(Math.floor((width * height) / 10000), 100);
    particles.current = [];
    
    for (let i = 0; i < particleCount; i++) {
      particles.current.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 3 + 1,
        speedX: Math.random() * 0.5 - 0.25,
        speedY: Math.random() * 0.5 - 0.25,
        color: color,
        opacity: Math.random() * 0.5 + 0.2
      });
    }
  };
  
  // 绘制粒子并更新位置
  const drawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);
    
    particles.current.forEach(particle => {
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fillStyle = particle.color.replace(')', `, ${particle.opacity})`).replace('rgb', 'rgba');
      ctx.fill();
      
      // 更新粒子位置
      particle.x += particle.speedX;
      particle.y += particle.speedY;
      
      // 边界检查
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;
    });
    
    // 绘制粒子之间的连线
    drawLines(ctx, width, height);
  };
  
  // 绘制粒子之间的连线
  const drawLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const maxDistance = Math.min(width, height) * 0.15; // 最大连线距离
    
    for (let i = 0; i < particles.current.length; i++) {
      for (let j = i + 1; j < particles.current.length; j++) {
        const dx = particles.current[i].x - particles.current[j].x;
        const dy = particles.current[i].y - particles.current[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.2;
          ctx.beginPath();
          ctx.moveTo(particles.current[i].x, particles.current[i].y);
          ctx.lineTo(particles.current[j].x, particles.current[j].y);
          ctx.strokeStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  };
  
  // 调整粒子系统大小
  const resizeCanvas = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const container = canvas.parentElement;
      
      if (container) {
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        initParticles(canvas.width, canvas.height);
      }
    }
  };
  
  // 动画循环
  const animate = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    drawParticles(ctx, canvas.width, canvas.height);
    animationFrameId.current = requestAnimationFrame(animate);
  };
  
  useEffect(() => {
    // 初始化画布
    resizeCanvas();
    
    // 处理窗口大小变化
    window.addEventListener('resize', resizeCanvas);
    
    // 开始动画
    animate();
    
    // 清理函数
    return () => {
      cancelAnimationFrame(animationFrameId.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);
  
  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0 
      }}
    />
  );
};

export default ParticleBackground;

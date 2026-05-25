import React, { useEffect, useRef } from 'react';

/**
 * Animated 3D Aurora Mesh Background
 * Renders a flowing, organic aurora-like wave effect with depth simulation,
 * interactive mouse tracking, and floating holographic orbs.
 */
export default function Background3D() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    let time = 0;
    const mouse = { x: width / 2, y: height / 2 };

    // Floating orbs with depth
    const orbs = [];
    const orbCount = 35;
    for (let i = 0; i < orbCount; i++) {
      orbs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 3 + 0.5,
        radius: Math.random() * 3 + 1,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        hue: Math.random() > 0.5 ? 230 : 180, // indigo or cyan
        phase: Math.random() * Math.PI * 2,
      });
    }

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // Aurora wave function - creates flowing 3D ribbon shapes
    function drawAuroraWave(yBase, amplitude, wavelength, speed, color1, color2, alpha) {
      ctx.beginPath();
      ctx.moveTo(0, height);

      for (let x = 0; x <= width; x += 3) {
        // Multi-layered sine waves for organic movement
        const mouseInfluence = Math.sin((x - mouse.x) * 0.003) * 20 * (1 - Math.min(Math.abs(x - mouse.x) / (width * 0.4), 1));
        const y = yBase
          + Math.sin((x / wavelength) + time * speed) * amplitude
          + Math.sin((x / (wavelength * 0.6)) + time * speed * 1.3) * (amplitude * 0.4)
          + Math.cos((x / (wavelength * 1.8)) + time * speed * 0.7) * (amplitude * 0.25)
          + mouseInfluence;
        ctx.lineTo(x, y);
      }

      ctx.lineTo(width, height);
      ctx.closePath();

      const grad = ctx.createLinearGradient(0, yBase - amplitude * 2, 0, height);
      grad.addColorStop(0, color1);
      grad.addColorStop(0.4, color2);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.globalAlpha = alpha;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Glow orb rendering
    function drawOrb(orb) {
      orb.x += orb.vx * orb.z;
      orb.y += orb.vy * orb.z;

      // Pulsing radius
      const pulseRadius = orb.radius * orb.z * (1 + Math.sin(time * 2 + orb.phase) * 0.3);

      // Wrap around screen
      if (orb.x < -20) orb.x = width + 20;
      if (orb.x > width + 20) orb.x = -20;
      if (orb.y < -20) orb.y = height + 20;
      if (orb.y > height + 20) orb.y = -20;

      // Draw soft glow
      const glowGrad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, pulseRadius * 8);
      glowGrad.addColorStop(0, `hsla(${orb.hue}, 80%, 65%, 0.15)`);
      glowGrad.addColorStop(1, `hsla(${orb.hue}, 80%, 65%, 0)`);
      ctx.fillStyle = glowGrad;
      ctx.fillRect(orb.x - pulseRadius * 8, orb.y - pulseRadius * 8, pulseRadius * 16, pulseRadius * 16);

      // Draw core dot
      ctx.beginPath();
      ctx.arc(orb.x, orb.y, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${orb.hue}, 85%, 75%, ${0.4 + Math.sin(time * 2 + orb.phase) * 0.2})`;
      ctx.fill();
    }

    // Draw connection lines between nearby orbs
    function drawConnections() {
      for (let i = 0; i < orbs.length; i++) {
        for (let j = i + 1; j < orbs.length; j++) {
          const dx = orbs[i].x - orbs[j].x;
          const dy = orbs[i].y - orbs[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 160) {
            const alpha = (1 - dist / 160) * 0.08;
            ctx.beginPath();
            ctx.moveTo(orbs[i].x, orbs[i].y);
            ctx.lineTo(orbs[j].x, orbs[j].y);
            ctx.strokeStyle = `rgba(99, 200, 241, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }
    }

    const animate = () => {
      time += 0.008;

      // Clear with dark base
      ctx.fillStyle = '#080C14';
      ctx.fillRect(0, 0, width, height);

      // Large ambient glow spots that drift
      const gx1 = width * (0.3 + Math.sin(time * 0.4) * 0.15);
      const gy1 = height * (0.3 + Math.cos(time * 0.3) * 0.1);
      const g1 = ctx.createRadialGradient(gx1, gy1, 0, gx1, gy1, Math.max(width, height) * 0.5);
      g1.addColorStop(0, 'rgba(99, 102, 241, 0.07)');
      g1.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, width, height);

      const gx2 = width * (0.7 + Math.cos(time * 0.35) * 0.15);
      const gy2 = height * (0.7 + Math.sin(time * 0.45) * 0.1);
      const g2 = ctx.createRadialGradient(gx2, gy2, 0, gx2, gy2, Math.max(width, height) * 0.5);
      g2.addColorStop(0, 'rgba(6, 182, 212, 0.06)');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, width, height);

      const gx3 = width * (0.5 + Math.sin(time * 0.25) * 0.2);
      const gy3 = height * (0.5 + Math.cos(time * 0.5) * 0.15);
      const g3 = ctx.createRadialGradient(gx3, gy3, 0, gx3, gy3, Math.max(width, height) * 0.35);
      g3.addColorStop(0, 'rgba(217, 70, 239, 0.04)');
      g3.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g3;
      ctx.fillRect(0, 0, width, height);

      // Render aurora waves (back to front for depth)
      drawAuroraWave(height * 0.85, 40, 300, 0.5, 'rgba(99, 102, 241, 0.08)', 'rgba(6, 182, 212, 0.03)', 0.6);
      drawAuroraWave(height * 0.75, 55, 250, 0.7, 'rgba(6, 182, 212, 0.10)', 'rgba(99, 102, 241, 0.04)', 0.5);
      drawAuroraWave(height * 0.65, 45, 200, 0.9, 'rgba(217, 70, 239, 0.07)', 'rgba(99, 102, 241, 0.03)', 0.4);
      drawAuroraWave(height * 0.55, 35, 350, 1.1, 'rgba(99, 102, 241, 0.06)', 'rgba(6, 182, 212, 0.02)', 0.35);

      // Draw connection mesh
      drawConnections();

      // Draw floating orbs
      orbs.forEach(drawOrb);

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
      }}
    />
  );
}

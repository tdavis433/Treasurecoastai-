import { useEffect, useRef } from "react";

interface BackgroundFXProps {
  primaryRgb?: string;
  secondaryRgb?: string;
}

function ParticleField({ color = "0, 229, 204" }: { color?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    const particleCount = 40;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.008 + 0.003
      });
    }

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${particle.opacity})`;
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrame);
    };
  }, [color]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.8 }}
    />
  );
}

function AmbientBackground({ primaryRgb = "0, 229, 204", secondaryRgb = "168, 85, 247" }: { primaryRgb?: string; secondaryRgb?: string }) {
  return (
    <>
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, rgba(${primaryRgb}, 0.08) 0%, transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 20%, rgba(${secondaryRgb}, 0.05) 0%, transparent 40%),
            radial-gradient(ellipse 60% 40% at 20% 80%, rgba(${primaryRgb}, 0.04) 0%, transparent 40%)
          `,
          animation: 'ambientShift 35s ease-in-out infinite'
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `
            conic-gradient(from 0deg at 50% 50%, 
              rgba(${primaryRgb}, 0.03) 0deg,
              rgba(10, 15, 25, 0.02) 90deg,
              rgba(0, 0, 0, 0.01) 180deg,
              rgba(10, 15, 25, 0.02) 270deg,
              rgba(${primaryRgb}, 0.03) 360deg
            )
          `,
          animation: 'cinematicRotate 100s linear infinite',
          opacity: 0.4
        }}
      />
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-[0.04]"
        style={{
          background: `
            linear-gradient(90deg, transparent 0%, rgba(${primaryRgb}, 0.2) 50%, transparent 100%)
          `,
          animation: 'glowStreak 25s linear infinite',
          transform: 'translateX(-100%)'
        }}
      />
      <style>{`
        @keyframes ambientShift {
          0%, 100% { 
            opacity: 1;
            transform: scale(1);
          }
          50% { 
            opacity: 0.85;
            transform: scale(1.02);
          }
        }
        @keyframes cinematicRotate {
          0% { transform: rotate(0deg) scale(1.5); }
          100% { transform: rotate(360deg) scale(1.5); }
        }
        @keyframes glowStreak {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </>
  );
}

export default function BackgroundFX({ primaryRgb = "0, 229, 204", secondaryRgb = "168, 85, 247" }: BackgroundFXProps) {
  return (
    <>
      <AmbientBackground primaryRgb={primaryRgb} secondaryRgb={secondaryRgb} />
      <ParticleField color={primaryRgb} />
    </>
  );
}

export { ParticleField, AmbientBackground };

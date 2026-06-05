import { useEffect, useRef } from 'react';

export default function ParticlesBg() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    const count = 30;

    for (let i = 0; i < count; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      const size = 2 + Math.random() * 4;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDuration = `${15 + Math.random() * 25}s`;
      particle.style.animationDelay = `${Math.random() * 20}s`;
      particle.style.background = ['#00e5b0', '#4fc3f7', '#a29bfe', '#ffd166'][Math.floor(Math.random() * 4)];
      particle.style.opacity = '0';
      container.appendChild(particle);
      particles.push(particle);
    }

    return () => {
      particles.forEach(p => p.remove());
    };
  }, []);

  return <div ref={containerRef} className="particles-bg" />;
}

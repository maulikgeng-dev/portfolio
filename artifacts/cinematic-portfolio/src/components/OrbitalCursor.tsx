import { useEffect, useRef } from 'react';

export function OrbitalCursor() {
  const parentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia('(hover: none), (pointer: coarse)').matches ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const parent = parentRef.current;
    if (!parent) return;
    let targetX = -100;
    let targetY = -100;
    let x = targetX;
    let y = targetY;
    let frame = 0;
    let clickTimeout = 0;
    let hovering = false;
    let cursorReady = false;
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      targetX = event.clientX;
      targetY = event.clientY;
      if (!cursorReady) {
        x = targetX;
        y = targetY;
        parent.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        document.documentElement.classList.add('orbital-cursor-ready');
        cursorReady = true;
      }
    };
    const updateHover = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      const next = !!target?.closest('a, button, [data-cursor="project"]');
      if (next !== hovering) {
        hovering = next;
        parent.classList.toggle('is-hovering', hovering);
      }
    };
    const click = () => {
      parent.classList.add('is-clicking');
      window.clearTimeout(clickTimeout);
      clickTimeout = window.setTimeout(() => parent.classList.remove('is-clicking'), 420);
    };
    const tick = () => {
      x += (targetX - x) * 0.46;
      y += (targetY - y) * 0.46;
      parent.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerover', updateHover, { passive: true });
    window.addEventListener('pointerout', updateHover, { passive: true });
    window.addEventListener('pointerdown', click, { passive: true });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(clickTimeout);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerover', updateHover);
      window.removeEventListener('pointerout', updateHover);
      window.removeEventListener('pointerdown', click);
      document.documentElement.classList.remove('orbital-cursor-ready');
    };
  }, []);

  return (
    <div ref={parentRef} className="orbital-cursor" aria-hidden="true">
      <span className="cursor-core" />
      <span className="cursor-shell">
        <span className="cursor-orbit"><span className="cursor-satellite" /></span>
      </span>
      <span className="cursor-label">EXPLORE</span>
    </div>
  );
}

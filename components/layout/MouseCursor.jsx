// components/layout/MouseCursor.jsx
'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import styles from './MouseCursor.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';

export default function MouseCursor() {
  const cursorRef = useRef(null);
  const hoverContainerRef = useRef(null);
  const hoverTextRef = useRef(null);

  const [hoverText, setHoverText] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [isInverted, setIsInverted] = useState(false);

  const xTo = useRef(null);
  const yTo = useRef(null);
  const positionRef = useRef({ x: 0, y: 0 });
  const hoverContainerAnim = useRef(null);

  useTextAnimation(hoverTextRef, isHovering, {
    className: `Awrite Ms ${isInverted ? 'Awrite-inv' : ''}`,
    visibleClass: 'ivi',
    times: [0.15, 0.02, 0.1, 0.02, 0.01]
  });

  useEffect(() => {
    xTo.current = gsap.quickTo(cursorRef.current, 'x', { duration: 0.08, ease: 'none' });
    yTo.current = gsap.quickTo(cursorRef.current, 'y', { duration: 0.08, ease: 'none' });

    const handleMouseMove = (e) => {
      positionRef.current = { x: e.clientX, y: e.clientY };
      xTo.current(e.clientX);
      yTo.current(e.clientY);
    };

    const handleMouseDown = () => document.documentElement.classList.add('mouse-down');
    const handleMouseUp = () => document.documentElement.classList.remove('mouse-down');

    const handleMouseOver = (e) => {
      if (e.target.closest('.MW')) {
        const target = e.target.closest('.MW');
        const tt = target.dataset.tt || '';
        const invert = target.classList.contains('Awrite-inv') || target.dataset.w === '1';

        setHoverText(tt);
        setIsInverted(invert);
        setIsHovering(true);
      }
    };

    const handleMouseOut = (e) => {
      if (e.target.closest('.MW')) {
        const related = e.relatedTarget;
        if (!related || !related.closest('.MW')) {
          setIsHovering(false);
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseover', handleMouseOver);
    document.body.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseover', handleMouseOver);
      document.body.removeEventListener('mouseout', handleMouseOut);
      hoverContainerAnim.current?.kill();
    };
  }, []);

  useEffect(() => {
    if (hoverContainerAnim.current) hoverContainerAnim.current.kill();

    if (isHovering && hoverText && hoverContainerRef.current) {
      hoverContainerAnim.current = gsap.fromTo(
        hoverContainerRef.current,
        { width: 0 },
        { width: 'auto', duration: 0.2, ease: 'power1.inOut', overwrite: true }
      );
    } else if (hoverContainerRef.current) {
      hoverContainerAnim.current = gsap.to(hoverContainerRef.current, {
        width: 0,
        duration: 0.2,
        ease: 'power1.inOut',
        overwrite: true,
      });
    }
  }, [isHovering, hoverText]);

  return (
    <div ref={cursorRef} className={styles.mouse}>
      <div ref={hoverContainerRef} className={styles.mouse_el} style={{ width: 0 }}>
        {hoverText && (
          <span ref={hoverTextRef} className={`Awrite Ms ${isInverted ? 'Awrite-inv' : ''}`}>
            {hoverText}
          </span>
        )}
      </div>
    </div>
  );
}
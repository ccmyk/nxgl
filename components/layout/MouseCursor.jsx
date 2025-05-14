// components/layout/MouseCursor.jsx
'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import styles from './MouseCursor.module.pcss';

export default function MouseCursor() {
  const cursorRef = useRef(null);

  useEffect(() => {
    const moveCursor = ({ clientX: x, clientY: y }) => {
      gsap.to(cursorRef.current, { x, y, duration: 0.3, ease: 'power2.inOut' });
    };
    window.addEventListener('mousemove', moveCursor);

    return () => window.removeEventListener('mousemove', moveCursor);
  }, []);

  return <div ref={cursorRef} className={styles.cursor} />;
}
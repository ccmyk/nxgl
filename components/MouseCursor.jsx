// components/MouseCursor.jsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import styles from './MouseCursor.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';

export default function MouseCursor() {
  const cursorRef = useRef(null);
  const hoverContentRef = useRef(null); // Ref for the child text element if needed
  const [hoverText, setHoverText] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [isHoverInverted, setIsHoverInverted] = useState(false); // For Awrite-inv style
  const positionRef = useRef({ x: 0, y: 0 }); // Store current mouse position

  // Refs for GSAP quickTo functions
  const xTo = useRef(null);
  const yTo = useRef(null);
  // Ref for hover element animation
  const hoverAnimRef = useRef(null);

  // We might need access to the text animation hook later
  // const { initTextAnimation, animateText } = useTextAnimation();

  // Initialize GSAP quickTo and listeners
  useEffect(() => {
    // Initialize quickTo for smooth following
    xTo.current = gsap.quickTo(cursorRef.current, "x", { duration: 0.08, ease: "none" });
    yTo.current = gsap.quickTo(cursorRef.current, "y", { duration: 0.08, ease: "none" });

    const handleMouseMove = (event) => {
      const { clientX, clientY } = event;
      positionRef.current = { x: clientX, y: clientY };
      xTo.current(clientX);
      yTo.current(clientY);
    };

    const handleMouseDown = () => document.documentElement.classList.add('mouse-down');
    const handleMouseUp = () => document.documentElement.classList.remove('mouse-down');

    // Event delegation for hover effects on elements with 'MW' class
    const handleMouseEnter = (event) => {
      if (event.target.classList.contains('MW')) {
        const text = event.target.dataset.tt || ''; // Get text from data-tt
        const isInverted = event.target.classList.contains('Awrite-inv'); // Check style
        setHoverText(text);
        setIsHoverInverted(isInverted);
        setIsHovering(true);
      }
    };

    const handleMouseLeave = (event) => {
      if (event.target.classList.contains('MW')) {
        setIsHovering(false);
      }
    };

    // Attach listeners
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseover', handleMouseEnter); // Use delegation
    document.body.addEventListener('mouseout', handleMouseLeave); // Use delegation

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseover', handleMouseEnter);
      document.body.removeEventListener('mouseout', handleMouseLeave);
      if (hoverAnimRef.current) hoverAnimRef.current.kill();
    };
  }, []);

  // Effect for animating the hover text container in/out
  useEffect(() => {
    if (hoverAnimRef.current) hoverAnimRef.current.kill(); // Kill previous animation

    if (isHovering && hoverText) {
      // Animate in (mimics original width animation)
      hoverAnimRef.current = gsap.fromTo(
        `.${styles.hoverElement}`, // Target the element via its module class
        { width: 0 },
        { width: 'auto', duration: 0.2, ease: 'power1.out', overwrite: true,
          onStart: () => {
            // Initialize/play text animation *after* element starts appearing
            // This would use the useTextAnimation hook on hoverContentRef.current
            // e.g., animateText(hoverContentRef.current, 1);
          }
        }
      );
    } else {
      // Animate out
      hoverAnimRef.current = gsap.to(
        `.${styles.hoverElement}`,
        { width: 0, duration: 0.2, ease: 'power1.in', overwrite: true,
           onStart: () => {
            // Reverse/hide text animation *before* element shrinks
             // e.g., animateText(hoverContentRef.current, -1); // Assuming -1 means hide
           }
        }
      );
    }
  }, [isHovering, hoverText]);


  return (
    <div ref={cursorRef} className={styles.mouse}>
      {/* Conditionally render the hover element */}
      {(isHovering && hoverText) && (
        <div className={styles.hoverElement} style={{ width: 0 }}> {/* Start hidden */}
           {/* Apply Awrite styles & invert class conditionally */}
           {/* We use a placeholder span for now, replace with animated component later */}
          <span
            ref={hoverContentRef}
            className={`${styles.AwritePlaceholder} ${isHoverInverted ? styles.inverted : ''}`}
          >
            {hoverText}
          </span>
        </div>
      )}
    </div>
  );
}
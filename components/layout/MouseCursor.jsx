// components/MouseCursor.jsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import gsap from 'gsap';
import styles from './MouseCursor.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation'; // Import the hook

export default function MouseCursor() {
  const cursorRef = useRef(null);
  const hoverElementRef = useRef(null); // Ref for the container div
  const hoverContentRef = useRef(null); // Ref specifically for the text span
  const [hoverText, setHoverText] = useState('');
  const [isHovering, setIsHovering] = useState(false);
  const [isHoverInverted, setIsHoverInverted] = useState(false);
  const positionRef = useRef({ x: 0, y: 0 });

  // Refs for GSAP quickTo functions
  const xTo = useRef(null);
  const yTo = useRef(null);
  // Ref for hover element container animation
  const hoverContainerAnimRef = useRef(null);

  // Use the text animation hook for the hover content
  // isActive will be controlled by isHovering state
  useTextAnimation(hoverContentRef, isHovering, {
    // Use faster timings for the quick hover effect if desired
    times: [0.15, 0.02, 0.1, 0.02, 0.01], // Example: Faster timings
    initialState: 'hidden', // Start hidden
    className: `Awrite Ms ${isHoverInverted ? 'Awrite-inv' : ''}`, // Apply base classes + conditional inverted
    visibleClass: 'ivi', // Add visible class on complete
  });

  // Initialize GSAP quickTo and listeners
  useEffect(() => {
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

    // Event delegation for hover effects
    const handleMouseEnter = (event) => {
      if (event.target.matches && event.target.matches('.MW')) { // More specific check
        const text = event.target.dataset.tt || '';
        const isInverted = event.target.classList.contains('Awrite-inv');
        const isDark = event.target.dataset.w === '1'; // Check for dark background flag

        // Only update state if text is different or hover state changes
        // to avoid unnecessary re-renders/animation restarts
        if (text !== hoverText || !isHovering) {
            setHoverText(text);
            setIsHoverInverted(isInverted || isDark); // Apply inverted style if Awrite-inv or data-w="1"
            setIsHovering(true);
        }
      }
    };

    const handleMouseLeave = (event) => {
      if (event.target.matches && event.target.matches('.MW')) {
        // Check if the mouse is moving *to* another MW element quickly
        // This prevents flickering if elements are close together
        const relatedTarget = event.relatedTarget;
        if (!relatedTarget || !relatedTarget.closest('.MW')) {
             setIsHovering(false);
             // Optionally reset text immediately or let the animation handle it
             // setHoverText('');
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.addEventListener('mouseover', handleMouseEnter);
    document.body.addEventListener('mouseout', handleMouseLeave);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.removeEventListener('mouseover', handleMouseEnter);
      document.body.removeEventListener('mouseout', handleMouseLeave);
      hoverContainerAnimRef.current?.kill();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHovering, hoverText]); // Add dependencies that affect hover logic

  // Effect for animating the hover text *container* (width animation)
  useEffect(() => {
    if (hoverContainerAnimRef.current) hoverContainerAnimRef.current.kill();

    if (isHovering && hoverText && hoverElementRef.current) {
      // Animate in
      hoverContainerAnimRef.current = gsap.fromTo(
        hoverElementRef.current,
        { width: 0 },
        {
          width: 'auto', // Animate to auto width
          duration: 0.2, // Quick animation
          ease: 'power1.out',
          overwrite: true,
          // Delay text animation slightly until container starts opening
          // onStart: () => { /* Text animation is now handled by useTextAnimation hook based on isHovering */ }
        }
      );
    } else if (hoverElementRef.current) {
      // Animate out (only if element exists)
      hoverContainerAnimRef.current = gsap.to(
        hoverElementRef.current,
        {
          width: 0,
          duration: 0.2,
          ease: 'power1.in',
          overwrite: true,
          // onComplete: () => {
          //   // Optionally clear text *after* animation if needed
          //   // setHoverText('');
          // }
        }
      );
    }
  }, [isHovering, hoverText]); // Depend on hover state and text content

  // Determine the class for the hover content span
  const hoverContentClasses = [
      styles.hoverContent, // Base class for the span
      'Awrite', // Base Awrite class for hook
      'Ms', // Specific style class from legacy?
      isHoverInverted ? 'Awrite-inv' : '' // Conditional inverted class
  ].filter(Boolean).join(' '); // Filter out empty strings and join

  return (
    <div ref={cursorRef} className={styles.mouse}>
      {/* Container for the hover text, controlled by GSAP width animation */}
      <div ref={hoverElementRef} className={styles.hoverElement} style={{ width: 0 }}>
         {/* The actual text span, animated by useTextAnimation */}
         {/* Render span only when there's text to prevent hook errors */}
         {hoverText && (
             <span ref={hoverContentRef} className={hoverContentClasses}>
                 {hoverText}
             </span>
         )}
      </div>
    </div>
  );
}

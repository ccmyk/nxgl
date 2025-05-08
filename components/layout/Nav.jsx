// components/layout/Nav.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import styles from './Nav.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation'; // Assuming hook is correct now

export default function Nav() {
  const [timeString, setTimeString] = useState('');
  const [clockActive, setClockActive] = useState(false); // To mimic clockact flag
  const navRef = useRef(null);
  const logoRef = useRef(null);
  const cityRef = useRef(null);
  const hoursRef = useRef(null);
  const minutesRef = useRef(null);
  const ampmRef = useRef(null);
  const indexLinkRef = useRef(null);
  const aboutLinkRef = useRef(null);
  const playgroundLinkRef = useRef(null);
  const contactLinkRef = useRef(null);
  // Refs for clock parts needed for update animations
  const hoursAnimTrigger = useRef(0); // Use refs to trigger update animation
  const minutesAnimTrigger = useRef(0);

  // --- Clock Update Logic ---
  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      let currentH = date.getHours();
      let currentM = date.getMinutes();
      let ampm = 'AM';
      let displayH = currentH;

      if (displayH >= 12) { ampm = 'PM'; if (displayH > 12) displayH -= 12; }
      if (displayH === 0) displayH = 12;

      const newTimeString = `${String(displayH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}${ampm}`;

      // Trigger animation only if time changed AND clock is active
      if (clockActive && newTimeString !== timeString) {
        // Increment trigger refs to re-run animation effects
        // (Alternatively, pass timeString as dependency, but might trigger too often)
        // A more robust way might involve comparing old/new digits
        if (timeString.substring(0, 2) !== newTimeString.substring(0, 2)) hoursAnimTrigger.current++;
        if (timeString.substring(3, 5) !== newTimeString.substring(3, 5)) minutesAnimTrigger.current++;
        // AM/PM change is less frequent, could check specifically
         if (timeString.substring(5) !== newTimeString.substring(5)) hoursAnimTrigger.current++; // Re-trigger H+AMPM

        setTimeString(newTimeString);
      } else if (!clockActive) {
         // Update time state even if not animating yet
         setTimeString(newTimeString);
      }
    };

    updateClock();
    const intervalId = setInterval(updateClock, 1000); // Check every second for minute change
    return () => clearInterval(intervalId);
  }, [timeString, clockActive]); // Depend on timeString and clockActive status

  // --- Initial Nav Fade In & Animation Activation ---
  useEffect(() => {
    if (navRef.current) {
      // Fade in Nav slightly after mount
      gsap.to(navRef.current, {
        opacity: 1,
        duration: 0.1,
        delay: 0.1, // Small delay for fade
        onComplete: () => {
          // Set clock active *after* initial animations might have run
          // This mimics the original this.clockact = 1 happening at the end of show()
          setClockActive(true);
        }
      });
       // Fade in clock separator ':' after a delay matching clock text
       gsap.to(`.${styles.clock_s}`, { opacity: 1, duration: 0.1, delay: 0.4 });
    }
  }, []);

  // --- Apply Text Animations ---
  // isActive is true for initial load animations.
  // Delays are derived from the sequencing in the original Nav.show() method
  // (ignoring commented-out timeouts means minimal delay between groups).
  const navBaseDelay = 0.2; // Start delay after nav fade-in
  const clockStartDelay = navBaseDelay + 0.1; // Minimal stagger after logo
  const linksStartDelay = clockStartDelay + 0.2; // Minimal stagger after clock

  // Hook Usage: Pass `isActive: true` for initial reveal.
  // Params object only includes delay calculated from original sequence.
  useTextAnimation(logoRef, true, { params: { delay: navBaseDelay } });
  useTextAnimation(cityRef, true, { params: { delay: clockStartDelay } });

  // For clock parts that update, add triggerDependency based on state change
  useTextAnimation(hoursRef, true, {
      params: { delay: clockStartDelay + 0.05 },
      triggerDependencies: [hoursAnimTrigger.current] // Re-run if trigger changes
  });
  useTextAnimation(minutesRef, true, {
      params: { delay: clockStartDelay + 0.10 },
      triggerDependencies: [minutesAnimTrigger.current] // Re-run if trigger changes
  });
   useTextAnimation(ampmRef, true, {
      params: { delay: clockStartDelay + 0.15 },
      triggerDependencies: [hoursAnimTrigger.current] // Re-run if AM/PM changes
  });

  useTextAnimation(indexLinkRef, true, { params: { delay: linksStartDelay } });
  useTextAnimation(aboutLinkRef, true, { params: { delay: linksStartDelay + 0.05 } });
  useTextAnimation(playgroundLinkRef, true, { params: { delay: linksStartDelay + 0.10 } });
  useTextAnimation(contactLinkRef, true, { params: { delay: linksStartDelay + 0.15 } }); // Applying same stagger

  return (
    <nav ref={navRef} className={styles.nav} style={{ opacity: 0 }}>
      <div className={styles.nav_blur}><div></div><div></div><div></div><div></div></div>
      <div className={`${styles.top} ${styles.c_vw}`}>
        <div className={styles.left}>
          {/* Attach refs directly to text containers */}
          <Link ref={logoRef} className={styles.logo} href="/" data-type="index">
             CHRIS HALL
          </Link>
          <div className={styles.sep}></div>
          <div className={styles.clock}>
             <span ref={cityRef} className={styles.clock_p}>BCN</span>
             <span ref={hoursRef} className={styles.clock_h}>{timeString.substring(0,2)}</span>
             <div className={styles.clock_s}>{/* Colon style managed in CSS */}</div>
             <span ref={minutesRef} className={styles.clock_m}>{timeString.substring(3,5)}</span>
             <span ref={ampmRef} className={styles.clock_a}>{timeString.substring(5)}</span>
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.right_ops}>
            <Link ref={indexLinkRef} href="/index/" data-type="projects">INDEX</Link>
            <Link ref={aboutLinkRef} href="/about/" data-type="about">ABOUT</Link>
            <Link ref={playgroundLinkRef} href="/playground/" data-type="playground">PLAYGROUND</Link>
          </div>
          <a ref={contactLinkRef} className={styles.inverted} href="mailto:chris@chrishall.io">
             LETS TALK
          </a>
        </div>
      </div>
    </nav>
  );
}
// components/layout/Nav.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link'; // Use Next.js Link for client-side routing
import gsap from 'gsap';
import styles from './Nav.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation'; // Import the hook

export default function Nav() {
  const [timeString, setTimeString] = useState('00:00AM'); // Initial placeholder
  const [clockActive, setClockActive] = useState(false); // Control when clock animations run
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

  // Refs to track if clock parts need re-animation
  const hoursAnimTrigger = useRef(0);
  const minutesAnimTrigger = useRef(0);
  const ampmAnimTrigger = useRef(0);
  const prevTimeString = useRef(''); // Store previous time to detect changes

  // --- Clock Update Logic ---
  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      let currentH = date.getHours();
      let currentM = date.getMinutes();
      let ampm = 'AM';
      let displayH = currentH;

      if (displayH >= 12) { ampm = 'PM'; if (displayH > 12) displayH -= 12; }
      if (displayH === 0) displayH = 12; // Handle midnight

      const newH = String(displayH).padStart(2, '0');
      const newM = String(currentM).padStart(2, '0');
      const newTimeString = `${newH}:${newM}${ampm}`;

      // Trigger animation *only if digits change* and clock is active
      if (clockActive && newTimeString !== prevTimeString.current) {
        if (prevTimeString.current.substring(0, 2) !== newH) hoursAnimTrigger.current++;
        if (prevTimeString.current.substring(3, 5) !== newM) minutesAnimTrigger.current++;
        if (prevTimeString.current.substring(5) !== ampm) ampmAnimTrigger.current++; // Trigger AM/PM change

        setTimeString(newTimeString); // Update state
        prevTimeString.current = newTimeString; // Store new time
      } else if (!clockActive && newTimeString !== timeString) {
         // Update state initially even if not animating yet
         setTimeString(newTimeString);
         prevTimeString.current = newTimeString;
      }
    };

    updateClock(); // Initial call
    const intervalId = setInterval(updateClock, 1000); // Check every second
    return () => clearInterval(intervalId); // Cleanup interval
  }, [clockActive, timeString]); // Depend on clockActive status

  // --- Initial Nav Fade In & Animation Activation ---
  useEffect(() => {
    if (navRef.current) {
      gsap.to(navRef.current, {
        opacity: 1,
        duration: 0.1, // Quick fade
        delay: 0.1, // Small delay
        onComplete: () => {
          // Activate clock animations *after* initial text reveals start
          setClockActive(true);
        }
      });
      // Fade in clock separator ':' - adjust delay as needed
      gsap.to(`.${styles.nav_clock_s}`, { opacity: 1, duration: 0.1, delay: 0.5 }); // Example delay
    }
  }, []);

  // --- Apply Text Animations ---
  // isActive is true for initial load animations.
  // Delays based on legacy sequence (minimal staggering)
  const navBaseDelay = 0.2; // Start delay after nav fade-in
  const clockStartDelay = navBaseDelay + 0.05;
  const linksStartDelay = clockStartDelay + 0.15;

  // Logo and City - standard reveal
  useTextAnimation(logoRef, true, { params: { delay: navBaseDelay } });
  useTextAnimation(cityRef, true, { params: { delay: clockStartDelay } });

  // Clock parts - use triggerDependencies to re-animate on change
  useTextAnimation(hoursRef, true, {
      params: { delay: clockStartDelay + 0.05 },
      triggerDependencies: [hoursAnimTrigger.current]
  });
  useTextAnimation(minutesRef, true, {
      params: { delay: clockStartDelay + 0.10 },
      triggerDependencies: [minutesAnimTrigger.current]
  });
   useTextAnimation(ampmRef, true, {
      params: { delay: clockStartDelay + 0.15 },
      triggerDependencies: [ampmAnimTrigger.current] // Triggered by hour/ampm change
  });

  // Links - standard reveal
  useTextAnimation(indexLinkRef, true, { params: { delay: linksStartDelay } });
  useTextAnimation(aboutLinkRef, true, { params: { delay: linksStartDelay + 0.05 } });
  useTextAnimation(playgroundLinkRef, true, { params: { delay: linksStartDelay + 0.10 } });
  useTextAnimation(contactLinkRef, true, { params: { delay: linksStartDelay + 0.15 }, className: 'Awrite Awrite-inv' }); // Add inverted class

  return (
    <nav ref={navRef} className={styles.nav} style={{ opacity: 0 }}> {/* Start hidden */}
      {/* Blur effect div - purely presentational */}
      <div className={styles.nav_blur}><div></div><div></div><div></div><div></div></div>

      {/* Top row container */}
      <div className={`${styles.nav_top} c-vw`}> {/* Use global padding class */}
        {/* Left side: Logo and Clock */}
        <div className={styles.nav_left}>
          {/* Logo - Apply ref to the Link/span */}
          <Link ref={logoRef} className={`${styles.nav_logo} Awrite`} href="/" data-type="index"> {/* Add Awrite class */}
             CHRIS HALL {/* Plain text, animation handled by hook */}
          </Link>
          <div className={styles.sep}></div> {/* Separator */}
          {/* Clock */}
          <div className={styles.nav_clock}>
             {/* Apply refs to spans containing text */}
             <span ref={cityRef} className={`${styles.nav_clock_p} Awrite`}>LAX</span>
             <span ref={hoursRef} className={`${styles.nav_clock_h} Awrite`}>{timeString.substring(0,2)}</span>
             <div className={styles.nav_clock_s}>:</div> {/* Colon */}
             <span ref={minutesRef} className={`${styles.nav_clock_m} Awrite`}>{timeString.substring(3,5)}</span>
             <span ref={ampmRef} className={`${styles.nav_clock_a} Awrite`}>{timeString.substring(5)}</span>
          </div>
        </div>

        {/* Right side: Links */}
        <div className={styles.nav_right}>
          <div className={styles.nav_right_ops}>
            {/* Apply refs to Links */}
            <Link ref={indexLinkRef} className="Awrite" href="/index/" data-type="projects">INDEX</Link>
            <Link ref={aboutLinkRef} className="Awrite" href="/about/" data-type="about">ABOUT</Link>
            <Link ref={playgroundLinkRef} className="Awrite" href="/playground/" data-type="playground">PLAYGROUND</Link>
          </div>
          {/* Contact Link - Apply ref and inverted class */}
          <a ref={contactLinkRef} className="Awrite Awrite-inv" href="mailto:chris@chrishall.io">
             LETS TALK
          </a>
        </div>
      </div>
    </nav>
  );
}

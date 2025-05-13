// components/layout/Nav.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import styles from './Nav.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';

export default function Nav({ currentTheme = 'light' }) {
  const [timeString, setTimeString] = useState('00:00AM');
  const [clockActive, setClockActive] = useState(false);
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

  const hoursAnimTrigger = useRef(0);
  const minutesAnimTrigger = useRef(0);
  const ampmAnimTrigger = useRef(0);
  const prevTimeString = useRef('');

  useEffect(() => {
    const updateClock = () => {
      const date = new Date();
      let currentH = date.getHours();
      let currentM = date.getMinutes();
      let ampm = 'AM';
      let displayH = currentH;
      if (displayH >= 12) {
        ampm = 'PM';
        if (displayH > 12) {
          displayH -= 12;
        }
      }
      if (displayH === 0) {
        displayH = 12;
      }
      const newH = String(displayH).padStart(2, '0');
      const newM = String(currentM).padStart(2, '0');
      const newTimeString = `${newH}:${newM}${ampm}`;

      if (clockActive && newTimeString !== prevTimeString.current) {
        if (prevTimeString.current.substring(0, 2) !== newH) {
          hoursAnimTrigger.current++;
        }
        if (prevTimeString.current.substring(3, 5) !== newM) {
          minutesAnimTrigger.current++;
        }
        if (prevTimeString.current.substring(5) !== ampm) {
          ampmAnimTrigger.current++;
        }
        setTimeString(newTimeString);
        prevTimeString.current = newTimeString;
      } else if (!clockActive && newTimeString !== timeString) {
        setTimeString(newTimeString);
        prevTimeString.current = newTimeString;
      }
    };
    updateClock();
    const intervalId = setInterval(updateClock, 1000);
    return () => clearInterval(intervalId);
  }, [clockActive, timeString]);

  useEffect(() => {
    if (navRef.current) {
      gsap.to(navRef.current, {
        opacity: 1, duration: 0.1, delay: 0.1,
        onComplete: () => setClockActive(true)
      });
      gsap.to(`.${styles.nav_clock_s}`, { opacity: 1, duration: 0.1, delay: 0.5 });
    }
  }, []);

  const navBaseDelay = 0.2;
  const clockStartDelay = navBaseDelay + 0.05;
  const linksStartDelay = clockStartDelay + 0.15;

  useTextAnimation(logoRef, true, { params: { delay: navBaseDelay } });
  useTextAnimation(cityRef, true, { params: { delay: clockStartDelay } });
  useTextAnimation(hoursRef, true, { params: { delay: clockStartDelay + 0.05 }, triggerDependencies: [hoursAnimTrigger.current] });
  useTextAnimation(minutesRef, true, { params: { delay: clockStartDelay + 0.10 }, triggerDependencies: [minutesAnimTrigger.current] });
  useTextAnimation(ampmRef, true, { params: { delay: clockStartDelay + 0.15 }, triggerDependencies: [ampmAnimTrigger.current] });
  useTextAnimation(indexLinkRef, true, { params: { delay: linksStartDelay } });
  useTextAnimation(aboutLinkRef, true, { params: { delay: linksStartDelay + 0.05 } });
  useTextAnimation(playgroundLinkRef, true, { params: { delay: linksStartDelay + 0.10 } });
  useTextAnimation(contactLinkRef, true, { params: { delay: linksStartDelay + 0.15 }, className: 'Awrite Awrite-inv' });

  // Apply theme class
  const navClasses = `${styles.nav} ${currentTheme === 'dark' ? styles.navThemeDark : styles.navThemeLight}`;

  return (
    <nav ref={navRef} className={navClasses} style={{ opacity: 0 }}>
      <div className={styles.nav_blur}><div></div><div></div><div></div><div></div></div>
      <div className={`${styles.nav_top} c-vw`}>
        <div className={styles.nav_left}>
          <Link ref={logoRef} className={`${styles.nav_logo} Awrite`} href="/" data-type="index">
             CHRIS HALL
          </Link>
          <div className={styles.sep}></div>
          <div className={styles.nav_clock}>
             <span ref={cityRef} className={`${styles.nav_clock_p} Awrite`}>LAX</span>
             <span ref={hoursRef} className={`${styles.nav_clock_h} Awrite`}>{timeString.substring(0,2)}</span>
             <div className={styles.nav_clock_s}>:</div>
             <span ref={minutesRef} className={`${styles.nav_clock_m} Awrite`}>{timeString.substring(3,5)}</span>
             <span ref={ampmRef} className={`${styles.nav_clock_a} Awrite`}>{timeString.substring(5)}</span>
          </div>
        </div>
        <div className={styles.nav_right}>
          <div className={styles.nav_right_ops}>
            <Link ref={indexLinkRef} className="Awrite" href="/index/" data-type="projects">INDEX</Link>
            <Link ref={aboutLinkRef} className="Awrite" href="/about/" data-type="about">ABOUT</Link>
            <Link ref={playgroundLinkRef} className="Awrite" href="/playground/" data-type="playground">PLAYGROUND</Link>
          </div>
          <a ref={contactLinkRef} className="Awrite Awrite-inv" href="mailto:chris@chrishall.io">
             LETS TALK
          </a>
        </div>
      </div>
    </nav>
  );
}

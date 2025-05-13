// components/layout/Nav.jsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import AnimatedText from '@/components/shared/AnimatedText';
import styles from './Nav.module.pcss';

export default function Nav({ currentTheme = 'light' }) {
  const [time, setTime] = useState(new Date());
  const [clockActive, setClockActive] = useState(false);
  const navRef = useRef(null);

  const getTimeParts = () => {
    const h = time.getHours();
    const m = time.getMinutes();
    const isPM = h >= 12;
    const hour = ((h + 11) % 12 + 1).toString().padStart(2, '0');
    const minute = m.toString().padStart(2, '0');
    const ampm = isPM ? 'PM' : 'AM';
    return { hour, minute, ampm };
  };

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (navRef.current) {
      gsap.to(navRef.current, {
        opacity: 1,
        duration: 0.1,
        delay: 0.1,
        onComplete: () => setClockActive(true),
      });
      gsap.to(`.${styles.nav_clock_s}`, {
        opacity: 1,
        duration: 0.1,
        delay: 0.5,
      });
    }
  }, []);

  const baseDelay = 0.2;
  const clockDelay = baseDelay + 0.1;
  const linkDelay = clockDelay + 0.2;
  const { hour, minute, ampm } = getTimeParts();

  const navClasses = `${styles.nav} ${currentTheme === 'dark' ? styles.navThemeDark : styles.navThemeLight}`;

  return (
    <nav ref={navRef} className={navClasses} style={{ opacity: 0 }}>
      <div className={styles.nav_blur}><div></div><div></div><div></div><div></div></div>
      <div className={`${styles.nav_top} c-vw`}>
        <div className={styles.nav_left}>
          <AnimatedText
            text="CHRISHALL"
            className={`${styles.nav_logo}`}
            tag={Link}
            href="/"
            params={baseDelay}
          />
          <div className={styles.sep}></div>
          <div className={styles.nav_clock}>
            <AnimatedText text="_LAX" className={styles.nav_clock_p} isActive={clockActive} params={clockDelay} />
            <AnimatedText text={hour} className={styles.nav_clock_h} isActive={clockActive} params={clockDelay + 0.05} />
            <div className={styles.nav_clock_s}>:</div>
            <AnimatedText text={minute} className={styles.nav_clock_m} isActive={clockActive} params={clockDelay + 0.10} />
            <AnimatedText text={ampm} className={styles.nav_clock_a} isActive={clockActive} params={clockDelay + 0.15} />
          </div>
        </div>
        <div className={styles.nav_right}>
          <div className={styles.nav_right_ops}>
            <AnimatedText text="INDEX" tag={Link} href="/projects" className="Awrite" params={linkDelay} />
            <AnimatedText text="ABOUT" tag={Link} href="/about" className="Awrite" params={linkDelay + 0.05} />
            <AnimatedText text="PLAYGROUND" tag={Link} href="/playground" className="Awrite" params={linkDelay + 0.1} />
          </div>
          <AnimatedText text="LETS TALK" tag="a" href="mailto:chris@chrishall.io" className="Awrite Awrite-inv" params={linkDelay + 0.15} />
        </div>
      </div>
    </nav>
  );
}

// components/layout/Footer.jsx
'use client';

import React, { useRef, useEffect } from 'react';
import Link from 'next/link';
import AnimatedText from '@/components/shared/AnimatedText';
import { useAnimatedText } from '@/hooks/useAnimatedText';
import styles from './Footer.module.pcss';

export default function Footer() {
  const footerRef = useRef(null);
  const ctaRef = useRef(null);
  const linksRefs = useRef([]);

  useAnimatedText(ctaRef, { clean: true, delay: 0.1 });
  linksRefs.current.forEach((ref, idx) => {
    useAnimatedText(ref, { clean: true, delay: 0.15 + idx * 0.05 });
  });

  useEffect(() => {
    // Setup interaction with WebGL (🔥 TtF.jsx component)
    const oielElements = footerRef.current.querySelectorAll('.Oiel');
    oielElements.forEach((el) => {
      el.setAttribute('data-webgl-target', 'TtF');
    });
  }, []);

  const links = [
    { href: 'https://www.instagram.com/chrishall/', label: 'Instagram' },
    { href: 'https://savee.it/chrishall/', label: 'Savee' },
    { href: 'https://www.linkedin.com/in/chris-hall/', label: 'LinkedIn' },
    { href: 'https://dribbble.com/chrishall', label: 'Dribbble' },
    { href: 'https://read.cv/chrishall', label: 'Read.cv' },
    { href: 'https://www.behance.net/chrishall', label: 'Behance' },
  ];

  return (
    <footer className={styles.footer} ref={footerRef}>
      <div className={styles.footer_cm}>
        <Link
          className={`Atitle MW ${styles.cta}`}
          href="mailto:chris@chrishall.io"
          aria-label="Send me an email"
          data-tt="let’s talk"
          data-w="1"
        >
          <div className="cCover"></div>
          <div className="Oi Oi-tt" data-temp="foot" data-foot="1" data-white="1"
            data-length="3" data-w="6" data-l="-0.022" data-m="5.4"
            data-text="Get in touch"></div>
          <h2 className="ttj Oiel" ref={ctaRef}>Get in touch</h2>
        </Link>
      </div>

      <div className={`c-vw ${styles.cnt}`}>
        <div className={styles.cnt_lk}>
          {links.map((link, i) => (
            <div className={styles.cnt_lk_el} key={i}>
              <Link className="Awrite" href={link.href} ref={el => linksRefs.current[i] = el}>
                {link.label}
                <i>
                  <svg viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6.492 3.516H5.676V2.052L5.748 1.272L5.712 1.26L4.944 2.124L0.912 6.156L0.336 5.58L4.368 1.548L5.232 0.78L5.22 0.744L4.44 0.816L2.976 0.816V0L6.492 0V3.516Z" fill="black"/>
                  </svg>
                </i>
              </Link>
            </div>
          ))}
        </div>
        <div className={styles.cnt_cp}>
          <AnimatedText className="Awrite" delay={0.5}>
            ©2025 Chris Hall — All Rights Reserved
          </AnimatedText>
        </div>
      </div>
    </footer>
  );
}
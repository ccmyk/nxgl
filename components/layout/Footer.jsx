// components/layout/TtF.jsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import styles from './Footer.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver'; // Will use this
// import Footer from '@/components/webgl/effects/Footer'; // Placeholder

export default function Footer() {
  const Footer = useRef(null);
  const instaLinkRef = useRef(null);
  const saveeLinkRef = useRef(null);
  const linkedinLinkRef = useRef(null);
  const dribbbleLinkRef = useRef(null);
  const readcvLinkRef = useRef(null);
  const behanceLinkRef = useRef(null);
  const designedByRef = useRef(null);
  const nameRef = useRef(null);
  const developedByRef = useRef(null);
  const csskillerRef = useRef(null);
  const copyrightRef = useRef(null);

  // Use Intersection Observer to trigger animations
  // Freeze once visible true because Footer animates in once
  const [isFooterVisible] = useIntersectionObserver(FooterRef, { threshold: 0.1 }, true);

  // Apply animations, triggered by isFooterVisible
  // Delay is 0 because they trigger immediately on intersection
  // Loop is true for credits based on original data-bucle="1"
  const baseDelay = 0; // Start immediately when visible
  useTextAnimation(instaLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.0 } });
  useTextAnimation(saveeLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.05 } });
  useTextAnimation(linkedinLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.1 } });
  useTextAnimation(dribbbleLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.15 } });
  useTextAnimation(readcvLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.2 } });
  useTextAnimation(behanceLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.25 } });

  useTextAnimation(designedByRef, isFooterVisible, { params: { delay: baseDelay + 0.3 } });
  useTextAnimation(nameRef, isFooterVisible, { params: { delay: baseDelay + 0.3 }, loop: true });

  useTextAnimation(developedByRef, isFooterVisible, { params: { delay: baseDelay + 0.35 } });
  useTextAnimation(csskillerRef, isFooterVisible, { params: { delay: baseDelay + 0.35 }, loop: true });

  useTextAnimation(copyrightRef, isFooterVisible, { params: { delay: baseDelay + 0.4 } });

  return (
    // Add ref to the element being observed
    <Footer ref={FooterRef} className={styles.Footer}>
      <div className={styles.Footer_cm}>
        {/* Placeholder for WebGL Title */}
        <a
          className={`${styles.Atitle} ${styles.MW}`}
          href="mailto:chris.d.hall@icloud.com" // Corrected Email
          aria-label="Contact"
          data-tt="let’s talk" data-w="1"
        >
          <div className={styles.cCover}></div>
          <h2 className={`${styles.ttj} ${styles.Oiel}`}>Get in touch</h2>
        </a>
      </div>
      <div className={`${styles.cnt} ${styles.c_vw}`}>
        <div className={styles.cnt_lk}>
          {/* Apply refs to actual text containers (span or the a itself) */}
          <div className={styles.cnt_lk_el}>
            <a ref={linkedinLinkRef} href="https://www.linkedin.com/in/chrisdhall/">Linkedin<i>{/* Icon */}</i></a>
          </div>
          {/* Add other links similarly with refs */}
           <div className={styles.cnt_lk_el}>
            <a ref={wnwLinkRef} href="https://workingnotworking.com/12028-chris/">WorkingNotWorking<i>{/* Icon */}</i></a>
          </div>
           <div className={styles.cnt_lk_el}>
            <a ref={cvLinkRef} href="https://drive.google.com/file/d/1wc46fxHbb2AgoNOu4dyDVxxVjjE_XZ1z/">Resume<i>{/* Icon */}</i></a>
          </div>
        </div>
        <div className={styles.cnt_cr}>
          <div className={styles.cnt_cr_el}>
             <span ref={designedByRef} className={styles.creditLabel}>Designed by_</span>
             <span ref={nameRef} className={styles.creditName}>CHRIS HALL</span>
          </div>
        </div>
        <div className={styles.cnt_cp}>
          <span ref={copyrightRef} className={styles.copyright}>©2025_all rights reserved</span>
        </div>
      </div>
    </Footer>
  );
}
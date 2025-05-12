// components/layout/Footer.jsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import styles from './Footer.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import TtF from '@/components/webgl/TtF';
import { useWebGL } from '@/contexts/WebGLContext';

export default function Footer() {
  const { fonts, isInitialized, assetsLoaded } = useWebGL();
  // Select default font assets for footer title
  const fontJson = fonts['default']?.json;
  const fontTexture = fonts['default']?.texture;

  const footerRef = useRef(null);
  const titleInteractionRef = useRef(null);
  const titleIoRef = useRef(null);
  const linkedinLinkRef = useRef(null);
  const wnwLinkRef = useRef(null);
  const cvLinkRef = useRef(null);

  // Trigger text animations for link text when in view
  const [footerInView] = useIntersectionObserver(footerRef, { threshold: 0.1 }, true);
  useTextAnimation(linkedinLinkRef, footerInView);
  useTextAnimation(wnwLinkRef, footerInView);
  useTextAnimation(cvLinkRef, footerInView);

  const allAssetsReady = isInitialized && assetsLoaded;

  return (
    <footer ref={footerRef} className={styles.footer}>
      <div className={styles.footer_main}>
        {/* Interactive footer title */}
        <Link href="/contact" ref={titleInteractionRef} className={styles.footer_title}>
          {/* WebGL footer title effect (appears behind text) */}
          {allAssetsReady && fontJson && fontTexture && (
            <TtF 
              text="Get in touch"
              fontJson={fontJson}
              fontTexture={fontTexture}
              interactionElementRef={titleInteractionRef}
              ioRefSelf={titleIoRef}
              className={styles.footer_title_canvas}
            />
          )}
          {/* Fallback/static text for SEO and initial render */}
          <span className="Oiel">Get in touch</span>
        </Link>
        <div className={styles.footer_links}>
          <a ref={linkedinLinkRef} href="https://linkedin.com/in/chrisryanhall" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          <a ref={wnwLinkRef} href="https://workingnotworking.com/12028-chris" target="_blank" rel="noopener noreferrer">WorkingNotWorking</a>
          <a ref={cvLinkRef} href="/chrishall_resume.pdf" target="_blank" rel="noopener noreferrer">Resume</a>
        </div>
      </div>
      <div className={styles.footer_copy}>
        <p>© {new Date().getFullYear()} Chris Hall. All rights reserved.</p>
      </div>
    </footer>
  );
}
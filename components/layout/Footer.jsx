// components/layout/Footer.jsx
'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import styles from './Footer.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import TtF from '@/components/webgl/TtF'; // Import the WebGL Footer Title
import { useWebGL } from '@/contexts/WebGLContext'; // To get font data if needed

export default function Footer() {
  const { fontJson, fontTexture } = useWebGL(); // Get font assets from context

  const footerRef = useRef(null); // Ref for the main footer element IO
  const titleInteractionRef = useRef(null); // Ref for the title's interaction area (<a> tag)
  const titleIoRef = useRef(null); // Ref for the title's IO trigger (can be the same as interaction)

  // Refs for text elements to be animated
  const linkedinLinkRef = useRef(null);
  const wnwLinkRef = useRef(null); // Assuming this was meant to be WorkingNotWorking
  const cvLinkRef = useRef(null); // Assuming this was meant to be Resume/CV
  // Add refs for other links if they exist in your final HTML structure

  const designedByRef = useRef(null);
  const nameRef = useRef(null);
  const developedByRef = useRef(null); // Ref for "Developed by" if needed
  const csskillerRef = useRef(null); // Ref for "CSSKILLER" if needed
  const copyrightRef = useRef(null);

  // Use Intersection Observer for the whole footer to trigger animations
  const [isFooterVisible] = useIntersectionObserver(footerRef, { threshold: 0.1 }, true); // Freeze once visible

  // Apply animations, triggered by isFooterVisible
  const baseDelay = 0.1; // Start slightly after footer is in view

  // Animate Links (adjust delays and refs as needed)
  useTextAnimation(linkedinLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.0 } });
  useTextAnimation(wnwLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.1 } }); // Stagger links
  useTextAnimation(cvLinkRef, isFooterVisible, { params: { delay: baseDelay + 0.2 } });
  // Add useTextAnimation calls for other links (Read.cv, Behance, etc.) with appropriate refs and delays

  // Animate Credits
  useTextAnimation(designedByRef, isFooterVisible, { params: { delay: baseDelay + 0.3 } });
  useTextAnimation(nameRef, isFooterVisible, { params: { delay: baseDelay + 0.3 }, loop: true }); // Loop name

  // Uncomment and adjust if "Developed by CSSKILLER" is used
  // useTextAnimation(developedByRef, isFooterVisible, { params: { delay: baseDelay + 0.35 } });
  // useTextAnimation(csskillerRef, isFooterVisible, { params: { delay: baseDelay + 0.35 }, loop: true });

  // Animate Copyright
  useTextAnimation(copyrightRef, isFooterVisible, { params: { delay: baseDelay + 0.4 } });

  return (
    <footer ref={footerRef} className={styles.footer}>
      {/* WebGL Title Section */}
      <div ref={titleIoRef} className={styles.footer_cm}>
        <a
          ref={titleInteractionRef} // Ref for mouse interaction
          className={`${styles.Atitle} MW`} // Add MW class for mouse hover
          href="mailto:chris@chrishall.io" // Corrected Email
          aria-label="Contact"
          data-tt="let’s talk" // Text for hover effect
          data-w="1" // Flag for dark background hover text style
        >
          {/* Container for the WebGL Canvas */}
          <div className={styles.cCover}>
             {/* Render WebGL Title if font assets are ready */}
             {fontJson && fontTexture && (
                 <TtF
                     text="Get in touch"
                     fontJson={fontJson}
                     fontTexture={fontTexture}
                     interactionElementRef={titleInteractionRef} // Pass interaction ref
                     ioRefSelf={titleIoRef} // Pass IO ref
                     isVisible={isFooterVisible} // Control visibility via IO
                     // Pass other props like color, size, letterSpacing if needed
                 />
             )}
          </div>
          {/* Static text overlay (hidden by CSS or low opacity if WebGL renders) */}
          <h2 className={`${styles.ttj} ${styles.Oiel}`}>Get in touch</h2>
        </a>
      </div>

      {/* Bottom Links and Credits */}
      <div className={`${styles.cnt} c-vw`}> {/* Use global padding class */}
        <div className={styles.cnt_lk}>
          {/* Link Structure Example */}
          <div className={styles.cnt_lk_el}>
            <a ref={linkedinLinkRef} className="Awrite" href="https://www.linkedin.com/in/chrisryanhall" target="_blank" rel="noopener noreferrer">
                Linkedin
                <i>{/* SVG Icon Placeholder */}
                    <svg viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', position: 'relative', width: '0.8rem', height: '0.8rem' }}>
                      <path d="M6.49194 3.516H5.67594L5.67594 2.052L5.74794 1.272L5.71194 1.26L4.94394 2.124L0.911938 6.156L0.335937 5.58L4.36794 1.548L5.23194 0.78L5.21994 0.743999L4.43994 0.816L2.97594 0.816V0L6.49194 0L6.49194 3.516Z" fill="currentColor"/> {/* Use currentColor */}
                    </svg>
                </i>
            </a>
          </div>
           {/* Add other links similarly */}
           <div className={styles.cnt_lk_el}>
             <a ref={wnwLinkRef} className="Awrite" href="https://workingnotworking.com/12028-chris" target="_blank" rel="noopener noreferrer">WorkingNotWorking<i>{/* Icon */}</i></a>
           </div>
           <div className={styles.cnt_lk_el}>
             <a ref={cvLinkRef} className="Awrite" href="https://read.cv/evasanchezclemente" target="_blank" rel="noopener noreferrer">Resume<i>{/* Icon */}</i></a>
             {/* Note: Original link was to read.cv/evasanchezclemente, update if needed */}
           </div>
           {/* Add Dribbble, Read.cv, Behance links here with refs */}
        </div>

        {/* Credits */}
        <div className={styles.cnt_cr}>
          <div className={styles.cnt_cr_el}>
             {/* Apply refs and Awrite class */}
             <span ref={designedByRef} className={`${styles.creditLabel} Awrite`}>Designed by_</span>
             <span ref={nameRef} className={`${styles.creditName} Awrite`}>CHRIS HALL</span>
          </div>
           {/* Uncomment if Developed By section is needed
           <div className={styles.cnt_cr_el}>
             <span ref={developedByRef} className={`${styles.creditLabel} Awrite`}>Developed by_</span>
             <span ref={csskillerRef} className={`${styles.creditName} Awrite`}>CSSKILLER</span>
           </div>
           */}
        </div>

        {/* Copyright */}
        <div className={styles.cnt_cp}>
          <span ref={copyrightRef} className={`${styles.copyright} Awrite`}>©2024_all rights reserved</span>
        </div>
      </div>
    </footer>
  );
}

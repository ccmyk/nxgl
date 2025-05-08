// app/page.jsx

'use client';

import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';

import { useInView } from '@/hooks/useIntersectionObserver';
import { useSplitText } from '@/hooks/useSplitText';
import Title from '@/components/webgl/Tt';

import Footer from '@/components/layout/Footer';
import { useWebGLContext } from '@/contexts/WebGLContext';

export default function HomeHero() {
  const heroRef = useRef(null);
  const ttRef = useRef(null);
  const subTitleRef = useRef(null);
  const portfolioRef = useRef(null);
  const scrollRef = useRef(null);
  const linksRef = useRef(null);
  const { registerWebGLElement } = useWebGLContext();

  // Register this view for WebGL interactions
  useEffect(() => {
    if (heroRef.current) {
      registerWebGLElement('hero', heroRef.current);
    }
    
    // Set up scroll indicator animation
    const scrollAnim = gsap.to(scrollRef.current, {
      opacity: 0.6,
      yoyo: true,
      repeat: -1,
      duration: 1.2,
      ease: 'cubic-bezier(.55, 0, .1, 1)',
      paused: true
    });
    
    return () => {
      scrollAnim.kill();
    };
  }, [registerWebGLElement]);

  // Track when component enters viewport
  const entry = useInView(heroRef, { threshold: 0.1 });
  const inView = entry?.isIntersecting;

  // Apply split text to subtitle for animation
  useSplitText(subTitleRef, {
    types: 'lines',
    linesClass: 'tt3_line'
  });

  // Animation sequence
  useEffect(() => {
    if (!inView || !heroRef.current) return;

    // Main timeline for sequencing
    const tl = gsap.timeline({
      defaults: {
        ease: 'cubic-bezier(.55, 0, .1, 1)',
        duration: 0.6
      }
    });

    // Subtitle animation - matches legacy timing
    const lines = subTitleRef.current.querySelectorAll('.tt3_line');
    tl.fromTo(
      lines,
      { y: 20, opacity: 0 },
      { 
        y: 0, 
        opacity: 1, 
        stagger: 0.1,
      },
      1.2 // Delayed start
    );

    // Portfolio tag - matches legacy timing
    tl.fromTo(
      portfolioRef.current,
      { opacity: 0 },
      { opacity: 1 },
      1.6
    );

    // Scroll indicator - matches legacy timing
    tl.fromTo(
      scrollRef.current,
      { opacity: 0 },
      { 
        opacity: 1,
        onComplete: () => {
          // Start oscillating animation for scroll text
          gsap.to(scrollRef.current, {
            opacity: 0.6,
            yoyo: true,
            repeat: -1,
            duration: 1.2,
            ease: 'cubic-bezier(.55, 0, .1, 1)'
          });
        }
      },
      1.8
    );

    // Links - matches legacy timing
    tl.fromTo(
      linksRef.current.querySelectorAll('a'),
      { opacity: 0, y: 10 },
      { 
        opacity: 1, 
        y: 0,
        stagger: 0.1,
      },
      2.0
    );

    return () => {
      tl.kill();
    };
  }, [inView]);

  const words = [
    { text: 'Chris', l: '-0.022', idx: 0 },
    { text: 'Hall', l: '-0.016', idx: 1 },
  ];

  return (
    <section ref={heroRef} className="home_hero">
      <div className="c‑vw cnt">
        <div className="cnt_hold">
          {/** Main title with WebGL treatment **/}
          <h2 ref={ttRef} className="cnt_tt">
            {words.map(({ text, l, idx }) => (
              <div key={idx} className="Atitle">
                {/** Canvas container for WebGL title **/}
                <div className="cCover">
                  <Title text={text} index={idx} className="glF" />
                </div>
                {/** Invisible placeholder for original DOM position **/}
                <div
                  className="Oi Oi-tt"
                  data-temp="tt"
                  data-l={l}
                  data-m="5"
                  data-text={text}
                  data-oi={idx}
                  style={{ visibility: 'hidden' }}
                />
                {/** Text overlay that will be animated **/}
                <AnimatedWrite
                  className="ttj Oiel act"
                  data-temp="Oiel"
                  data-oi={idx}
                >
                  {text}
                </AnimatedWrite>
              </div>
            ))}
          </h2>

          {/** Subtitle section **/}
          <div className="cnt_bt inview stview">
            {/** Placeholder for intersection observer **/}
            <div
              className="iO"
              data-io="0"
              style={{ visibility: 'hidden' }}
            />
            {/** Animated subtitle **/}
            <h3 ref={subTitleRef} className="tt3">
              Art Director &amp; Designer<br/>
              Living in Los Angeles
            </h3>

            {/** Portfolio tag **/}
            <h4
              ref={portfolioRef}
              className="Awrite inview stview ivi"
              data-params="1.6"
            >
              <div
                className="iO iO-std"
                data-io="1"
                style={{ visibility: 'hidden' }}
              />
              <AnimatedWrite className="word" data-io="1">
                PORTFOLIO_2025
              </AnimatedWrite>
            </h4>
          </div>

          {/** Scroll indicator **/}
          <div className="cnt_sc">
            <h4
              ref={scrollRef}
              className="Awrite inview stview okF"
              data-params="1.6"
              data-bucle="1"
            >
              <div
                className="iO iO-std"
                data-io="2"
                style={{ visibility: 'hidden' }}
              />
              <AnimatedWrite className="word" data-io="2">
                [Scroll to Explore]
              </AnimatedWrite>
            </h4>
          </div>

          {/** Links section **/}
          <div ref={linksRef} className="cnt_lk">
            {[
              { href: 'https://drive.google.com/...', text: 'Resume',   io: 3 },
              { href: 'https://linkedin.com/in/...', text: 'LinkedIn', io: 4 }
            ].map(({ href, text, io }) => (
              <a
                key={io}
                className="Awrite inview stview ivi"
                data-params="0"
                href={href}
                target="_blank"
                rel="noopener"
              >
                <div
                  className="iO iO-std"
                  data-io={io}
                  style={{ visibility: 'hidden' }}
                />
                <AnimatedWrite className="word" data-io={io}>
                  {text}
                </AnimatedWrite>
                <i style={{ display: 'inline-block', position: 'relative' }}>
                  <svg
                    viewBox="0 0 7 7"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ display: 'inline-block', position: 'relative' }}
                  >
                    <path
                      d="M6.49194 3.516H5.67594L5.67594 2.052L5.74794 1.272L5.71194 1.26L4.94394 2.124L0.911938 6.156L0.335937 5.58L4.36794 1.548L5.23194 0.78L5.21994 0.743999L4.43994 0.816L2.97594 0.816V0L6.49194 0L6.49194 3.516Z"
                      fill="black"
                    />
                  </svg>
                </i>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
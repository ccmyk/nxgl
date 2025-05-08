// app/page.jsx
'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import styles from './page.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useWebGL } from '@/contexts/WebGLContext';
import { useLenis } from '@/hooks/useLenis';

// Import WebGL Components
import Tt from '@/components/webgl/Tt';
import TtA from '@/components/webgl/TtA';
import TtF from '@/components/webgl/TtF';
import Base from '@/components/webgl/Base';
import Bg from '@/components/webgl/Bg';

// Import Shared Components (Assume LazyMedia exists)
import LazyMedia from '@/components/shared/LazyMedia';

// --- Data (Replace with actual data fetching/props) ---
const heroData = { /* ... as before ... */ };
const projectsData = { /* ... as before ... */ };
const aboutData = { /* ... as before ... */ };
// --- ---

export default function HomePage() {
  // --- Refs ---
  // Hero Section
  const heroRef = useRef(null); // IO Trigger for the whole section
  const heroTitleInteractionRef = useRef(null); // Interaction element for Tt
  const heroSubtitleRef = useRef(null);
  const heroPortfolioTagRef = useRef(null);
  const heroScrollIndicatorRef = useRef(null);
  const heroLinksRef = useRef(null); // Container for links animation

  // Projects Section
  const projectsRef = useRef(null); // IO Trigger for the section
  const projectsTitleRef = useRef(null); // IO & Interaction for Tt
  const projectsCountRef = useRef(null);
  const projectItemRefs = useRef(projectsData.items.map(() => React.createRef())); // Refs for each project container (IO/Interaction trigger for Base)
  const projectMediaRefs = useRef(projectsData.items.map(() => React.createRef())); // Refs for actual media elements
  const projectsViewAllRef = useRef(null);

  // About Section
  const aboutRef = useRef(null); // IO Trigger for the section
  const aboutTitle1InteractionRef = useRef(null); // Interaction for TtA
  const aboutTitle2InteractionRef = useRef(null); // Interaction for TtA
  const aboutTitle1IoRef = useRef(null); // IO for TtA
  const aboutTitle2IoRef = useRef(null); // IO for TtA
  const aboutTextRef = useRef(null);
  const aboutTextIoRef = useRef(null); // IO for text animation
  const aboutImageTriggerRef = useRef(null); // IO/Interaction trigger for Base
  const aboutImageRef = useRef(null); // Ref for the media element
  const aboutReadMoreRef = useRef(null);
  const aboutBgIoRef = useRef(null); // IO trigger for Bg effect

  // --- Contexts and Hooks ---
  const { fontJson, fontTexture, isInitialized: webglReady } = useWebGL();
  const { lenis } = useLenis();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false); // Detect touch

  useEffect(() => {
    // Basic touch detection on mount
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // --- IO Observers ---
  const [heroInView] = useIntersectionObserver(heroRef, { threshold: 0.1 }, true);
  const [projectsTitleInView] = useIntersectionObserver(projectsTitleRef, { threshold: 0.1 }, true);
  const [projectsViewAllInView] = useIntersectionObserver(projectsViewAllRef, { threshold: 0.1 }, true);
  const [aboutBgInView] = useIntersectionObserver(aboutBgIoRef, { threshold: 0.05 }); // Don't freeze Bg
  const [aboutTextInView] = useIntersectionObserver(aboutTextIoRef, { threshold: 0.1 }, true);
  const [aboutReadMoreInView] = useIntersectionObserver(aboutReadMoreRef, { threshold: 0.1 }, true);
  // IO for individual project items (used to trigger their Base component)
  const projectItemIOStates = projectsData.items.map((_, index) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [inView] = useIntersectionObserver(projectItemRefs.current[index], { threshold: 0.2 }, true);
      return inView;
  });
  const aboutImageIOState = useIntersectionObserver(aboutImageTriggerRef, { threshold: 0.2 }, true)[0];


  // --- Text Animations ---
  // Hero
  useTextAnimation(heroPortfolioTagRef, heroInView, { params: { delay: 1.6 } });
  useTextAnimation(heroScrollIndicatorRef, heroInView, { params: { delay: 1.8 }, loop: true });
  useTextAnimation(heroLinksRef, heroInView, { params: { delay: 2.0 }, splitType: 'lines' });
  // Projects
  useTextAnimation(projectsCountRef, projectsTitleInView, { params: { delay: 0.2 } });
  projectsData.items.forEach((item, index) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useTextAnimation(projectItemRefs.current[index]?.current?.querySelector('h3'), projectItemIOStates[index], { params: { delay: 0.1 } });
  });
  useTextAnimation(projectsViewAllRef, projectsViewAllInView, { params: { delay: 0 } });
  // About
  useTextAnimation(aboutTextRef, aboutTextInView, { params: { delay: 0 }, splitType: 'lines' });
  useTextAnimation(aboutReadMoreRef, aboutReadMoreInView, { params: { delay: 0.1 } });

  // --- Scroll Progress for Background ---
  useEffect(() => {
    const lenisInstance = lenis?.current;
    if (!lenisInstance) return;
    const unsubscribe = lenisInstance.on('scroll', ({ progress }) => {
      setScrollProgress(progress);
    });
    return unsubscribe;
  }, [lenis]);

  // --- Manual GSAP Subtitle Animation ---
  useEffect(() => {
    if (!heroInView || !heroSubtitleRef.current) return;
    const lines = Array.from(heroSubtitleRef.current.childNodes).filter(node => node.nodeType === Node.ELEMENT_NODE || (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== ''));
    gsap.fromTo(lines,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'cubic-bezier(.55, 0, .1, 1)', delay: 1.2 }
    );
  }, [heroInView]);

  // --- Render ---
  return (
    <div className={styles.home}>

      {/* --- WebGL Background --- */}
      {webglReady && <Bg scrollProgress={scrollProgress} />}

      {/* --- Hero Section --- */}
      <section ref={heroRef} className={styles.home_hero}>
        <div className="c-vw cnt">
          <div className={styles.cnt_hold}>
            {/* Title */}
            <h2 ref={heroTitleInteractionRef} className={styles.cnt_tt}> {/* Ref for interaction */}
              {heroData.titleWords.map(({ text, l, m, idx }) => (
                <div key={idx} className="Atitle">
                  <div className="cCover">
                     {webglReady && fontJson && fontTexture && (
                       <Tt
                         text={text} fontJson={fontJson} fontTexture={fontTexture}
                         interactionElementRef={heroTitleInteractionRef} // Pass H2 ref
                         ioRefSelf={heroRef} isVisible={heroInView}
                         letterSpacing={parseFloat(l)} size={parseFloat(m)}
                       />
                     )}
                  </div>
                  <span className={`${styles.ttj} Oiel act`}>{text}</span>
                </div>
              ))}
            </h2>
            {/* Subtitle & Links */}
            <div className={`${styles.cnt_bt} ${heroInView ? 'stview inview' : ''}`}>
              <div className="iO" style={{ visibility: 'hidden' }} data-io="0"/>
              <h3 ref={heroSubtitleRef} className={`${styles.tt3}`}>
                {/* Ensure text nodes/spans exist for GSAP */}
                <span>{heroData.subtitleLine1}</span><br/>
                <span>{heroData.subtitleLine2}</span>
              </h3>
              <h4 ref={heroPortfolioTagRef} className="Awrite">
                <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io="1"/>
                {heroData.portfolioTag}
              </h4>
            </div>
          </div>
          {/* Scroll Indicator */}
          <div className={styles.cnt_sc}>
             <h4 ref={heroScrollIndicatorRef} className="Awrite okF" data-bucle="1">
                 <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io="2"/>
                 {heroData.scrollIndicator}
             </h4>
          </div>
          {/* Links */}
          <div ref={heroLinksRef} className={styles.cnt_lk}>
             {heroData.links.map(link => (
                 <a key={link.io} href={link.href} className="Awrite" target="_blank" rel="noopener noreferrer">
                     <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io={link.io}/>
                     {link.text}
                     <i>{/* SVG Icon */}</i>
                 </a>
             ))}
          </div>
        </div>
      </section>

      {/* --- Projects Section --- */}
      <section ref={projectsRef} className={styles.home_prjs}>
          <div className="c-vw cnt">
              <div ref={projectsTitleRef} className={styles.cnt_t}>
                  <div className="Atitle">
                      <div className="cCover">
                          {webglReady && fontJson && fontTexture && (
                              <Tt
                                  text={projectsData.sectionTitle} fontJson={fontJson} fontTexture={fontTexture}
                                  interactionElementRef={projectsTitleRef} ioRefSelf={projectsTitleRef}
                                  isVisible={projectsTitleInView} size={3.8} letterSpacing={-0.024}
                                  className="tt1"
                              />
                          )}
                      </div>
                      <h2 className={`${styles.tt1} Oiel`}>{projectsData.sectionTitle}</h2>
                  </div>
                  <h3 ref={projectsCountRef} className="Awrite">
                      <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io="6"/>
                      <span className="num">[{String(projectsData.items.length).padStart(2, '0')}]</span>
                  </h3>
              </div>

              <div className={styles.cnt_ft}>
                  {projectsData.items.map((item, index) => (
                      <Link
                          ref={projectItemRefs.current[index]}
                          key={item.id}
                          href={item.link}
                          className={`${styles.cnt_prj} ${styles[`cnt_prj-${index}`]} MW`}
                          data-tt="See more"
                      >
                          <div className={styles.cnt_prj_im}>
                              {/* IO placeholder for legacy compatibility? */}
                              <div className="Oi" style={{ visibility: 'hidden' }} data-oi={item.id + 2}/>
                              {/* Lazy Media */}
                              <LazyMedia
                                  ref={projectMediaRefs.current[index]}
                                  src={item.src} type={item.type} alt={item.title}
                                  aspectRatio={item.aspect} className={styles.mediaElement}
                              />
                              {/* WebGL Effect */}
                              {webglReady && (
                                  <Base
                                    src={item.src}
                                    triggerElementRef={projectItemRefs.current[index]} // Use link/container as trigger
                                    mediaElementRef={projectMediaRefs.current[index]}
                                    isVisible={projectItemIOStates[index]} // Control by individual IO state
                                    touch={isTouchDevice}
                                  />
                              )}
                          </div>
                          <div className={styles.cnt_prj_t}>
                              {/* Text animation applied via hook above */}
                              <h3 className="Awrite">
                                <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io={item.io}/>
                                <span className="num">[{String(index + 1).padStart(2, '0')}]_</span>
                                {item.title}
                              </h3>
                          </div>
                      </Link>
                  ))}
              </div>

              {/* View All Button Area */}
              <div className={styles.cnt_st}>
                 {/* Add placeholder project if needed for layout */}
                 <div className={styles.cnt_btn}>
                     <Link ref={projectsViewAllRef} href={projectsData.viewAllLink} className="Awrite Awrite-inv">
                         <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io="10"/>
                         See index
                     </Link>
                 </div>
              </div>
          </div>
      </section>

       {/* --- About Section --- */}
       <section ref={aboutRef} className={styles.home_about}>
           {/* IO Trigger for Background Effect */}
           <div ref={aboutBgIoRef} className="Oi Oi-bg" data-oi={aboutData.ioImage} style={{ position: 'absolute', top: '15vh', height: '50vh', width: '1px', left: 0 }}/>
           {/* Background effect is rendered globally */}

           <div className="c-vw cnt">
               {/* Titles */}
               <div className={styles.cnt_tp}>
                   <div ref={aboutTitle1IoRef} className="Atitle">
                       <div ref={aboutTitle1InteractionRef} className="cCover">
                           {webglReady && fontJson && fontTexture && (
                               <TtA
                                   text={aboutData.titleLine1} fontJson={fontJson} fontTexture={fontTexture}
                                   ioRefSelf={aboutTitle1IoRef} isVisible={isVisible} // Pass global visibility or specific IO
                                   interactionElementRef={aboutTitle1InteractionRef}
                                   color={1.0} // White text
                               />
                           )}
                       </div>
                       <h2 className={`${styles.tt1} Oiel`}>{aboutData.titleLine1}</h2>
                   </div>
                   <div ref={aboutTitle2IoRef} className="Atitle">
                       <div ref={aboutTitle2InteractionRef} className="cCover">
                          {webglReady && fontJson && fontTexture && (
                               <TtA
                                   text={aboutData.titleLine2} fontJson={fontJson} fontTexture={fontTexture}
                                   ioRefSelf={aboutTitle2IoRef} isVisible={isVisible}
                                   interactionElementRef={aboutTitle2InteractionRef}
                                   color={1.0}
                               />
                           )}
                       </div>
                       <h2 className={`${styles.tt1} Oiel`}>{aboutData.titleLine2}</h2>
                   </div>
               </div>

               {/* Text and Image */}
               <div className={styles.cnt_bp}>
                   <div ref={aboutTextIoRef} className={styles.cnt_x}>
                       <div className="Atext">
                           <div className="iO iO-std" data-io={aboutData.io} style={{ visibility: 'hidden' }}/>
                           <p ref={aboutTextRef} className="Atext_el">
                               {aboutData.text}
                           </p>
                       </div>
                       <Link ref={aboutReadMoreRef} href={aboutData.link} className={`${styles.linkXS} Awrite`}>
                           <span className="scr_read">About me</span>Read more
                       </Link>
                   </div>
                   <Link
                       ref={aboutImageTriggerRef}
                       href={aboutData.link}
                       className={`${styles.cnt_im} MW`}
                       data-tt="Read more" data-w="1"
                   >
                       <div className="Oi" data-oi={aboutData.ioMedia} style={{ visibility: 'hidden' }}/>
                       <LazyMedia
                           ref={aboutImageRef} src={aboutData.imageSrc} type="image"
                           alt="About Chris Hall" aspectRatio={aboutData.imageAspect}
                       />
                       {webglReady && (
                           <Base
                               src={aboutData.imageSrc}
                               triggerElementRef={aboutImageTriggerRef}
                               mediaElementRef={aboutImageRef}
                               isVisible={aboutImageIOState} // Use specific IO state
                               touch={isTouchDevice}
                           />
                       )}
                   </Link>
               </div>
           </div>
       </section>
    </div>
  );
}

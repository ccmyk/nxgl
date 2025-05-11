// app/page.jsx
'use client';

import React, { useRef, useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import styles from './page.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useWebGL } from '@/contexts/WebGLContext';
import { useLenis } from '@/hooks/useLenis';
// import { clamp, lerp } from '@/lib/math'; // Not used directly in this file after review

import Tt from '@/components/webgl/Tt';
import TtA from '@/components/webgl/TtA';
import Base from '@/components/webgl/Base';
import Bg from '@/components/webgl/Bg';
import LazyMedia from '@/components/shared/LazyMedia';

const heroData = { /* ...as before... */ };
const projectsData = { /* ...as before... */ };
const aboutData = { /* ...as before... */ };

export default function HomePage() {
  const heroRef = useRef(null);
  const heroTitleInteractionRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const heroPortfolioTagRef = useRef(null);
  const heroScrollIndicatorRef = useRef(null);
  const heroLinksContainerRef = useRef(null);

  const projectsRef = useRef(null);
  // Corrected: projectsTitleInteractionRef was used but not defined. Assuming it's the same as projectsTitleRef for IO and interaction.
  const projectsTitleRef = useRef(null); // This ref will be used for both IO and Tt interaction.
  const projectsCountRef = useRef(null);
  const projectItemContainersRef = useRef(projectsData.items.map(() => React.createRef()));
  const projectMediaElementsRef = useRef(projectsData.items.map(() => React.createRef()));
  const projectsViewAllRef = useRef(null);

  const aboutRef = useRef(null);
  const aboutTitle1InteractionRef = useRef(null);
  const aboutTitle2InteractionRef = useRef(null);
  const aboutTitle1IoRef = useRef(null);
  const aboutTitle2IoRef = useRef(null);
  const aboutTextContentRef = useRef(null);
  const aboutTextIoRef = useRef(null);
  const aboutImageInteractionRef = useRef(null);
  const aboutImageMediaRef = useRef(null);
  const aboutReadMoreRef = useRef(null);
  const aboutBgIoTriggerRef = useRef(null);

  const { fonts, isInitialized: webglReady, assetsLoaded: webglAssetsReady } = useWebGL();
  const { lenis } = useLenis();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  const [heroInView] = useIntersectionObserver(heroRef, { threshold: 0.1 }, true);
  const [projectsTitleInView] = useIntersectionObserver(projectsTitleRef, { threshold: 0.1 }, true);
  const [projectsViewAllInView] = useIntersectionObserver(projectsViewAllRef, { threshold: 0.1 }, true);
  // const [aboutBgInView] = useIntersectionObserver(aboutBgIoTriggerRef, { threshold: 0.05 }); // Marked as unused, remove if not used by Bg
  useIntersectionObserver(aboutBgIoTriggerRef, { threshold: 0.05 }); // If Bg uses it internally via context or direct prop
  const [aboutTextInView] = useIntersectionObserver(aboutTextIoRef, { threshold: 0.1 }, true);
  const [aboutReadMoreInView] = useIntersectionObserver(aboutReadMoreRef, { threshold: 0.1 }, true);
  const projectItemIOStates = projectsData.items.map((_, index) => {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [inView] = useIntersectionObserver(projectItemContainersRef.current[index], { threshold: 0.2 }, true);
      return inView;
  });
  const [aboutImageInView] = useIntersectionObserver(aboutImageInteractionRef, { threshold: 0.2 }, true);
  const [aboutTitle1InView] = useIntersectionObserver(aboutTitle1IoRef, { threshold: 0.1 }, true);
  const [aboutTitle2InView] = useIntersectionObserver(aboutTitle2IoRef, { threshold: 0.1 }, true);

  useTextAnimation(heroPortfolioTagRef, heroInView, { params: { delay: 1.6 } });
  useTextAnimation(heroScrollIndicatorRef, heroInView, { params: { delay: 1.8 }, loop: true });
  useTextAnimation(heroLinksContainerRef, heroInView, { params: { delay: 2.0 }, splitType: 'lines' });
  useTextAnimation(projectsCountRef, projectsTitleInView, { params: { delay: 0.2 } });
  projectsData.items.forEach((item, index) => {
      const h3Element = projectItemContainersRef.current[index]?.current?.querySelector('h3 > span:not(.num)');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useTextAnimation(h3Element ? { current: h3Element } : { current: null }, projectItemIOStates[index], { params: { delay: 0.1 } });
      const numElement = projectItemContainersRef.current[index]?.current?.querySelector('h3 > span.num');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useTextAnimation(numElement ? { current: numElement } : { current: null }, projectItemIOStates[index], { params: { delay: 0.05 } });
  });
  useTextAnimation(projectsViewAllRef, projectsViewAllInView, { params: { delay: 0 } });
  useTextAnimation(aboutTextContentRef, aboutTextInView, { params: { delay: 0 }, splitType: 'lines' });
  useTextAnimation(aboutReadMoreRef, aboutReadMoreInView, { params: { delay: 0.1 } });

  useEffect(() => {
    const lenisInstance = lenis?.current;
    if (!lenisInstance) return;
    const unsubscribe = lenisInstance.on('scroll', ({ progress }) => {
      setScrollProgress(progress);
    });
    return unsubscribe;
  }, [lenis]);

  useEffect(() => {
    if (!heroInView || !heroSubtitleRef.current) return;
    if (!heroSubtitleRef.current.dataset.animated) {
        const lines = heroSubtitleRef.current.innerHTML.split('<br>').map(line => `<span>${line.trim()}</span>`).join('');
        heroSubtitleRef.current.innerHTML = lines;
        gsap.fromTo(heroSubtitleRef.current.querySelectorAll('span'),
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.1, duration: 0.6, ease: 'cubic-bezier(.55, 0, .1, 1)', delay: 1.2 }
        );
        heroSubtitleRef.current.dataset.animated = "true";
    }
  }, [heroInView]);

  const allAssetsReady = webglReady && webglAssetsReady && fonts?.default?.json && fonts?.default?.texture;

  return (
    <div className={styles.home}>
      {allAssetsReady && <Bg scrollProgress={scrollProgress} /* onThemeChange={handleThemeChange} */ />} {/* Pass theme change handler */}

      <section ref={heroRef} className={styles.home_hero}>
        <div className="c-vw cnt">
          <div className={styles.cnt_hold}>
            <h2 ref={heroTitleInteractionRef} className={styles.cnt_tt}>
              {heroData.titleWords.map(({ text, l, m, idx, fontKey, dataOi }) => (
                <div key={idx} className="Atitle" data-oi={dataOi}>
                  <div className="cCover">
                     {allAssetsReady && (
                       <Tt
                         text={text} fontJson={fonts[fontKey]?.json} fontTexture={fonts[fontKey]?.texture}
                         interactionElementRef={heroTitleInteractionRef} ioRefSelf={heroRef}
                         isVisible={heroInView} letterSpacing={parseFloat(l)} size={parseFloat(m)}
                       />
                     )}
                  </div>
                  <span className={`${styles.ttj} Oiel act`}>{text}</span>
                </div>
              ))}
            </h2>
            <div className={`${styles.cnt_bt} ${heroInView ? 'stview inview' : ''}`}>
              <div className="iO" style={{ visibility: 'hidden' }} data-io="0"/>
              <h3 ref={heroSubtitleRef} className="tt3">
                 {heroData.subtitleLine1}<br/>{heroData.subtitleLine2}
              </h3>
              <h4 ref={heroPortfolioTagRef} className="Awrite">
                <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io="1"/>
                {heroData.portfolioTag}
              </h4>
            </div>
          </div>
          <div className={styles.cnt_sc}>
             <h4 ref={heroScrollIndicatorRef} className="Awrite okF" data-bucle="1">
                 <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io="2"/>
                 {heroData.scrollIndicator}
             </h4>
          </div>
          <div ref={heroLinksContainerRef} className={styles.cnt_lk}>
             {heroData.links.map(link => (
                 <a key={link.io} href={link.href} className="Awrite MW" target="_blank" rel="noopener noreferrer" data-tt={link.text}>
                     <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io={link.io}/>
                     {link.text}
                     <i>
                        <svg viewBox="0 0 7 7" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'inline-block', position: 'relative', width: '0.8rem', height: '0.8rem' }}>
                            <path d="M6.49194 3.516H5.67594L5.67594 2.052L5.74794 1.272L5.71194 1.26L4.94394 2.124L0.911938 6.156L0.335937 5.58L4.36794 1.548L5.23194 0.78L5.21994 0.743999L4.43994 0.816L2.97594 0.816V0L6.49194 0L6.49194 3.516Z" fill="currentColor"/>
                        </svg>
                     </i>
                 </a>
             ))}
          </div>
        </div>
      </section>

      <section ref={projectsRef} className={styles.home_prjs}>
          <div className="c-vw cnt">
              {/* Corrected: projectsTitleInteractionRef is projectsTitleRef */}
              <div ref={projectsTitleRef} className={styles.cnt_t}>
                  <div className="Atitle" data-oi="2">
                      {/* Corrected: projectsTitleInteractionRef is projectsTitleRef */}
                      <div ref={projectsTitleRef} className="cCover">
                          {allAssetsReady && (
                              <Tt text={projectsData.sectionTitle} fontJson={fonts[projectsData.fontKey]?.json} fontTexture={fonts[projectsData.fontKey]?.texture}
                                interactionElementRef={projectsTitleRef} // Use the same ref for interaction
                                ioRefSelf={projectsTitleRef} // And for IO
                                isVisible={projectsTitleInView} size={3.8} letterSpacing={-0.024}
                                width={33}
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
                      <Link ref={projectItemContainersRef.current[index]} key={item.id} href={item.link}
                          className={`${styles.cnt_prj} ${styles[`cnt_prj-${index}`]} MW`} data-tt="See more">
                          <div className={styles.cnt_prj_im}>
                              <div className="Oi" style={{ visibility: 'hidden' }} data-oi={item.dataOi}/>
                              <LazyMedia ref={projectMediaElementsRef.current[index]} src={item.src} type={item.type} alt={item.title}
                                  aspectRatio={item.aspect} className={styles.mediaElement} />
                              {webglReady && (
                                  <Base src={item.src} triggerElementRef={projectItemContainersRef.current[index]}
                                    mediaElementRef={projectMediaElementsRef.current[index]}
                                    isVisible={projectItemIOStates[index]} touch={isTouchDevice} />
                              )}
                          </div>
                          <div className={styles.cnt_prj_t}>
                              <h3 className="Awrite">
                                <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io={item.io}/>
                                <span className="num">[{String(index + 1).padStart(2, '0')}]_</span>
                                <span>{item.title}</span>
                              </h3>
                          </div>
                      </Link>
                  ))}
              </div>

              <div className={styles.cnt_st}>
                 <div className={styles.cnt_btn}>
                     <Link ref={projectsViewAllRef} href={projectsData.viewAllLink} className="Awrite Awrite-inv MW" data-tt="View All">
                         <div className="iO iO-std" style={{ visibility: 'hidden' }} data-io="10"/>
                         See index
                     </Link>
                 </div>
              </div>
          </div>
      </section>

       <section ref={aboutRef} className={styles.home_about}>
           <div ref={aboutBgIoTriggerRef} className="Oi Oi-bg" data-oi={aboutData.ioBgTrigger} style={{ position: 'absolute', top: '15vh', height: '50vh', width: '1px', left: 0 }}/>

           <div className="c-vw cnt">
               <div className={styles.cnt_tp}>
                   <div ref={aboutTitle1IoRef} className="Atitle" data-oi={aboutData.ioTitle1}>
                       <div ref={aboutTitle1InteractionRef} className="cCover">
                           {allAssetsReady && (
                               <TtA text={aboutData.titleLine1} fontJson={fonts[aboutData.fontKey]?.json} fontTexture={fonts[aboutData.fontKey]?.texture}
                                   ioRefSelf={aboutTitle1IoRef} isVisible={aboutTitle1InView}
                                   interactionElementRef={aboutTitle1InteractionRef} color={1.0}
                                   letterSpacing={-0.024} size={3.8}
                               />
                           )}
                       </div>
                       <h2 className={`${styles.tt1} Oiel`}>{aboutData.titleLine1}</h2>
                   </div>
                   <div ref={aboutTitle2IoRef} className="Atitle" data-oi={aboutData.ioTitle2}>
                       <div ref={aboutTitle2InteractionRef} className="cCover">
                          {allAssetsReady && (
                               <TtA text={aboutData.titleLine2} fontJson={fonts[aboutData.fontKey]?.json} fontTexture={fonts[aboutData.fontKey]?.texture}
                                   ioRefSelf={aboutTitle2IoRef} isVisible={aboutTitle2InView}
                                   interactionElementRef={aboutTitle2InteractionRef} color={1.0}
                                   letterSpacing={-0.032} size={3.8}
                               />
                           )}
                       </div>
                       <h2 className={`${styles.tt1} Oiel`}>{aboutData.titleLine2}</h2>
                   </div>
               </div>

               <div className={styles.cnt_bp}>
                   <div ref={aboutTextIoRef} className={styles.cnt_x}>
                       <div className="Atext">
                           <div className="iO iO-std" data-io={aboutData.ioText} style={{ visibility: 'hidden' }}/>
                           <p ref={aboutTextContentRef} className="Atext_el">
                               {aboutData.text}
                           </p>
                       </div>
                       <Link ref={aboutReadMoreRef} href={aboutData.link} className={`${styles.linkXS} Awrite MW`} data-tt="Learn More">
                           <span className="scr_read">About me</span>Read more
                       </Link>
                   </div>
                   <Link ref={aboutImageInteractionRef} href={aboutData.link}
                       className={`${styles.cnt_im} MW`} data-tt="Read more" data-w="1">
                       <div className="Oi" data-oi={aboutData.ioImageTrigger} style={{ visibility: 'hidden' }}/>
                       <LazyMedia ref={aboutImageMediaRef} src={aboutData.imageSrc} type="image"
                           alt="About Chris Hall" aspectRatio={aboutData.imageAspect} />
                       {webglReady && (
                           <Base src={aboutData.imageSrc} triggerElementRef={aboutImageInteractionRef}
                               mediaElementRef={aboutImageMediaRef} isVisible={aboutImageInView}
                               touch={isTouchDevice} />
                       )}
                   </Link>
               </div>
           </div>
       </section>
    </div>
  );
}

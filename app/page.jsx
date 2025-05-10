// app/page.jsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import gsap from 'gsap';
import styles from './page.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useWebGL } from '@/contexts/WebGLContext';
import { useLenis } from '@/hooks/useLenis';

// Import WebGL Components
import Tt from '@/components/webgl/Tt';
import TtA from '@/components/webgl/TtA';
// TtF (Footer Title) is rendered within the Footer component itself
import Base from '@/components/webgl/Base';
import Bg from '@/components/webgl/Bg';

// Import Shared Components
import LazyMedia from '@/components/shared/LazyMedia'; // Assume this component exists and forwards refs

// --- Data (Ensure paths are relative to /public or are absolute URLs) ---
const heroData = {
  titleWords: [
    { text: 'Chris', l: '-0.022', m: 5, fontKey: 'default', dataOi: 0 }, // Added fontKey and dataOi
    { text: 'Hall', l: '-0.016', m: 5, fontKey: 'default', dataOi: 1 },
  ],
  subtitleLine1: "Art Director & Designer",
  subtitleLine2: "Living in Los Angeles",
  portfolioTag: "PORTFOLIO_2024",
  scrollIndicator: "[scroll to explore]",
  links: [
    { href: 'https://drive.google.com/file/d/1wc46fxHbb2AgoNOu4dyDVxxVjjE_XZ1z/', text: 'Resume', io: 3 },
    { href: 'https://www.linkedin.com/in/chrisryanhall/', text: 'LinkedIn', io: 4 },
    // Add WNW link if it was present in legacy HTML:
    // { href: 'https://workingnotworking.com/12028-chris', text: 'WorkingNotWorking', io: 5 },
  ]
};
const projectsData = {
  sectionTitle: "Featured works",
  fontKey: 'default', // Font for the section title
  items: [
    { id: 1, title: "Banjo Soundscapes Portfolio", type: 'video', src: '/videos/placeholder/02_eva_sanchez_banjo_cover_soundscape_website.mp4', link: '/project/banjo', aspect: '720/540', io: 7, dataOi: 3 },
    { id: 2, title: "Ciclope Fest Website", type: 'image', src: '/images/placeholder/02.2_eva_sanchez_ciclope_fest_cover_website.jpg', link: '/project/ciclope', aspect: '1164/1558', io: 8, dataOi: 4 },
    { id: 3, title: "Kids Agency Website", type: 'video', src: '/videos/placeholder/00_eva_sanchez_kids_agency_cover_website.mp4', link: '/project/kids-agency', aspect: '720/540', io: 9, dataOi: 5 },
  ],
  viewAllLink: "/projects/" // Or "/index/" based on legacy nav
};
const aboutData = {
  titleLine1: "Interactive Designer,",
  titleLine2: "also Speaker & Teacher",
  fontKey: 'default', // Font for these titles
  text: `Enthusiastic about graphic design, typography, and the dynamic areas of motion and web-based animations. Specialized in translating brands into unique and immersive digital user experiences.`,
  imageSrc: '/images/placeholder/00_eva_sanchez_abou_home_website-1366x2049.jpg',
  imageAspect: '1387/2080',
  link: '/about/',
  ioText: 11,
  ioBgTrigger: 6,
  ioTitle1: 7,
  ioTitle2: 8,
  ioImageTrigger: 9,
};
// ---

export default function HomePage() {
  // --- Refs ---
  const heroRef = useRef(null);
  const heroTitleInteractionRef = useRef(null); // For the <h2> wrapping Tt components
  const heroSubtitleRef = useRef(null);
  const heroPortfolioTagRef = useRef(null);
  const heroScrollIndicatorRef = useRef(null);
  const heroLinksContainerRef = useRef(null); // Ref for the container of links

  const projectsRef = useRef(null);
  const projectsTitleInteractionRef = useRef(null); // For the <div> wrapping Tt
  const projectsCountRef = useRef(null);
  const projectItemContainersRef = useRef(projectsData.items.map(() => React.createRef())); // Refs for each project's <a> tag
  const projectMediaElementsRef = useRef(projectsData.items.map(() => React.createRef())); // Refs for <LazyMedia> internal img/video
  const projectsViewAllRef = useRef(null);

  const aboutRef = useRef(null);
  const aboutTitle1InteractionRef = useRef(null); // For the first TtA's .cCover
  const aboutTitle2InteractionRef = useRef(null); // For the second TtA's .cCover
  const aboutTitle1IoRef = useRef(null); // For the first TtA's .Atitle container
  const aboutTitle2IoRef = useRef(null); // For the second TtA's .Atitle container
  const aboutTextContentRef = useRef(null); // For the <p> tag
  const aboutTextIoRef = useRef(null); // For the .Atext container
  const aboutImageInteractionRef = useRef(null); // For the <a> tag wrapping the image
  const aboutImageMediaRef = useRef(null); // For the <LazyMedia> internal img
  const aboutReadMoreRef = useRef(null);
  const aboutBgIoTriggerRef = useRef(null); // Specific empty div for Bg IO trigger

  // --- Contexts and Hooks ---
  const { fonts, isInitialized: webglReady, assetsLoaded: webglAssetsReady } = useWebGL();
  const { lenis } = useLenis();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // --- IO Observers ---
  const [heroInView] = useIntersectionObserver(heroRef, { threshold: 0.1 }, true);
  const [projectsTitleInView] = useIntersectionObserver(projectsTitleRef, { threshold: 0.1 }, true);
  const [projectsViewAllInView] = useIntersectionObserver(projectsViewAllRef, { threshold: 0.1 }, true);
  const [aboutBgInView] = useIntersectionObserver(aboutBgIoTriggerRef, { threshold: 0.05 });
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

  // --- Text Animations ---
  useTextAnimation(heroPortfolioTagRef, heroInView, { params: { delay: 1.6 } });
  useTextAnimation(heroScrollIndicatorRef, heroInView, { params: { delay: 1.8 }, loop: true });
  useTextAnimation(heroLinksContainerRef, heroInView, { params: { delay: 2.0 }, splitType: 'lines' });
  useTextAnimation(projectsCountRef, projectsTitleInView, { params: { delay: 0.2 } });
  projectsData.items.forEach((item, index) => {
      const h3Ref = projectItemContainersRef.current[index]?.current?.querySelector('h3');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useTextAnimation(h3Ref, projectItemIOStates[index], { params: { delay: 0.1 } });
  });
  useTextAnimation(projectsViewAllRef, projectsViewAllInView, { params: { delay: 0 } });
  useTextAnimation(aboutTextContentRef, aboutTextInView, { params: { delay: 0 }, splitType: 'lines' });
  useTextAnimation(aboutReadMoreRef, aboutReadMoreInView, { params: { delay: 0.1 } });

  // --- Scroll Progress for Background ---
  useEffect(() => {
    const lenisInstance = lenis?.current;
    if (!lenisInstance) {
      return;
    }
    const unsubscribe = lenisInstance.on('scroll', ({ progress }) => {
      setScrollProgress(progress);
    });
    return unsubscribe;
  }, [lenis]);

  // --- Manual GSAP Subtitle Animation ---
  useEffect(() => {
    if (!heroInView || !heroSubtitleRef.current) {
      return;
    }
    if (!heroSubtitleRef.current.dataset.animated) { // Prevent re-animating
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

  // --- Render ---
  return (
    <div className={styles.home}>
      {allAssetsReady && <Bg scrollProgress={scrollProgress} />}

      <section ref={heroRef} className={styles.home_hero}>
        <div className="c-vw cnt"> {/* Legacy .c-vw for global padding */}
          <div className={styles.cnt_hold}>
            <h2 ref={heroTitleInteractionRef} className={styles.cnt_tt}> {/* Interaction ref for Tt */}
              {heroData.titleWords.map(({ text, l, m, idx, fontKey, dataOi }) => (
                <div key={idx} className="Atitle" data-oi={dataOi}> {/* Legacy .Atitle and data-oi */}
                  <div className="cCover"> {/* Legacy .cCover */}
                     {allAssetsReady && (
                       <Tt
                         text={text} fontJson={fonts[fontKey]?.json} fontTexture={fonts[fontKey]?.texture}
                         interactionElementRef={heroTitleInteractionRef} ioRefSelf={heroRef}
                         isVisible={heroInView} letterSpacing={parseFloat(l)} size={parseFloat(m)}
                       />
                     )}
                  </div>
                  <span className={`${styles.ttj} Oiel act`}>{text}</span> {/* Legacy .Oiel.act */}
                </div>
              ))}
            </h2>
            <div className={`${styles.cnt_bt} ${heroInView ? 'stview inview' : ''}`}> {/* Legacy state classes */}
              <div className="iO" style={{ visibility: 'hidden' }} data-io="0"/> {/* Legacy IO placeholder */}
              <h3 ref={heroSubtitleRef} className="tt3"> {/* Legacy .tt3 */}
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
                     <i>{/* SVG Icon (from legacy) */}
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
              <div ref={projectsTitleRef} className={styles.cnt_t}> {/* IO Trigger for title */}
                  <div className="Atitle" data-oi="2"> {/* Legacy data-oi for Tt */}
                      <div ref={projectsTitleInteractionRef} className="cCover"> {/* Interaction trigger for Tt */}
                          {allAssetsReady && (
                              <Tt text={projectsData.sectionTitle} fontJson={fonts[projectsData.fontKey]?.json} fontTexture={fonts[projectsData.fontKey]?.texture}
                                interactionElementRef={projectsTitleInteractionRef} ioRefSelf={projectsTitleRef}
                                isVisible={projectsTitleInView} size={3.8} letterSpacing={-0.024}
                                width={33} // From legacy data-w
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
                              <h3 className="Awrite"> {/* Text animation applied via hook */}
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
                                   letterSpacing={-0.024} size={3.8} // From legacy data-l, data-m
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
                                   letterSpacing={-0.032} size={3.8} // From legacy data-l, data-m
                               />
                           )}
                       </div>
                       <h2 className={`${styles.tt1} Oiel`}>{aboutData.titleLine2}</h2>
                   </div>
               </div>

               <div className={styles.cnt_bp}>
                   <div ref={aboutTextIoRef} className={styles.cnt_x}>
                       <div className="Atext"> {/* Wrapper for text animation */}
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
                       className={`${styles.cnt_im} MW`} data-tt="Read more" data-w="1"> {/* data-w="1" for inverted hover text */}
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

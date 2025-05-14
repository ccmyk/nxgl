// app/page.jsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import Link from 'next/link';
import styles from './page.module.pcss';
import { useTextAnimation } from '@/hooks/useTextAnimation';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useWebGL } from '@/contexts/WebGLContext';
import { useLenis } from '@/hooks/useLenis';

import Tt from '@/components/webgl/Tt';
import TtA from '@/components/webgl/TtA';
import Base from '@/components/webgl/Base';
import Bg from '@/components/webgl/Bg';
import LazyMedia from '@/components/shared/LazyMedia';

const heroData = {
  titleWords: [
    { text: 'Chris', l: -0.02, m: 9.2, fontKey: 'default', dataOi: 1 },
    { text: 'Hall', l: -0.02, m: 9.2, fontKey: 'default', dataOi: 2 },
  ],
  subtitle: 'Art Director & Designer',
  portfolioTag: 'Portfolio',
};

const projectsData = {
  sectionTitle: 'Featured works',
  items: [
    {
      id: 1,
      title: 'Banjo Soundscapes Portfolio',
      type: 'video',
      src: '/videos/placeholders/02_eva_sanchez_banjo_cover_soundscape_website.mp4',
      link: '/project/banjo',
      aspect: '720/540',
    },
    {
      id: 2,
      title: 'Ciclope Fest Website',
      type: 'image',
      src: '/images/placeholders/02.2_eva_sanchez_ciclope_fest_cover_website.jpg',
      link: '/project/ciclope',
      aspect: '1164/1558',
    },
    {
      id: 3,
      title: 'Kids Agency Website',
      type: 'video',
      src: '/videos/placeholders/00_eva_sanchez_kids_agency_cover_website.mp4',
      link: '/project/kids-agency',
      aspect: '720/540',
    },
  ],
};

const aboutData = {
  titleLine1: 'Interactive Designer,',
  titleLine2: 'also Speaker & Teacher',
  fontKey: 'default',
  text: `Enthusiastic about graphic design, typography, and the dynamic areas of motion and web-based animations. Specialized in translating brands into unique and immersive digital user experiences.`,
  imageSrc: '/images/placeholders/00_eva_sanchez_abou_home_website-1366x2049.jpg',
  imageAspect: '1387/2080',
  link: '/about',
};

export default function HomePage() {
  // Refs for hero section
  const heroRef = useRef(null);
  const heroTitleInteractionRef = useRef(null);
  const heroSubtitleRef = useRef(null);
  const heroPortfolioTagRef = useRef(null);
  const heroScrollIndicatorRef = useRef(null);
  const heroLinksContainerRef = useRef(null);

  // Refs for projects section
  const projectsRef = useRef(null);
  const projectsTitleRef = useRef(null); // For section title
  const projectsCountRef = useRef(null); // (If we had a count display)
  const projectItemContainersRef = useRef(projectsData.items.map(() => React.createRef()));
  const projectMediaElementsRef = useRef(projectsData.items.map(() => React.createRef()));
  const projectsViewAllRef = useRef(null);

  // Refs for about section
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

  const { fonts, isInitialized: webglReady, assetsLoaded: webglAssetsReady } = useWebGL();
  const { lenis } = useLenis();
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect if touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Lenis scroll progress tracking for Bg and others
  useEffect(() => {
    if (!lenis) return;
    const updateScroll = ({ progress }) => {
      setScrollProgress(progress);
    };
    lenis.on('scroll', updateScroll);
    return () => {
      lenis.off('scroll', updateScroll);
    };
  }, [lenis]);

  // Intersection observers for revealing sections
  const [heroInView] = useIntersectionObserver(heroRef, { threshold: 0.2 }, true);
  const [projectsInView] = useIntersectionObserver(projectsRef, { threshold: 0.1 }, true);
  const [aboutInView] = useIntersectionObserver(aboutRef, { threshold: 0.1 }, true);

  // Trigger text animations (fade-in writing effect) on subtitle and portfolio tag when hero in view
  useTextAnimation(heroSubtitleRef, heroInView);
  useTextAnimation(heroPortfolioTagRef, heroInView);

  const allAssetsReady = webglReady && webglAssetsReady;

  return (
    <div className={styles.home}>
      {/* Fullscreen background WebGL effect (noise) */}
      {allAssetsReady && <Bg scrollProgress={scrollProgress} />}

      {/* HERO Section */}
      <section ref={heroRef} className={styles.home_hero}>
        <div className="c-vw cnt">
          <div className={styles.cnt_hold}>
            <h2 ref={heroTitleInteractionRef} className={styles.cnt_tt}>
              {heroData.titleWords.map(({ text, l, m, fontKey, dataOi }, idx) => (
                <div key={idx} className="Atitle" data-oi={dataOi}>
                  <div className="cCover">
                    {allAssetsReady && (
                      <Tt
                        text={text}
                        fontKey={fontKey}
                        interactionElementRef={heroTitleInteractionRef}
                        ioRefSelf={heroRef}
                        isVisible={heroInView}
                        letterSpacing={parseFloat(l)}
                        size={parseFloat(m)}
                      />
                    )}
                    <span className="Oiel">{text}</span>
                  </div>
                </div>
              ))}
            </h2>
            <h3 ref={heroSubtitleRef} className="Awrite" data-params="0.8">
              {heroData.subtitle}
            </h3>
            <p ref={heroPortfolioTagRef} className="Awrite" data-params="0.8">
              {heroData.portfolioTag}
            </p>
          </div>
          <div className={styles.hero_links} ref={heroLinksContainerRef}>
            <Link href="#projects" className={styles.scroll_indicator} ref={heroScrollIndicatorRef}>
              Scroll Down
            </Link>
          </div>
        </div>
      </section>

      {/* PROJECTS Section */}
      <section ref={projectsRef} id="projects" className={styles.home_projects}>
        <div className="c-vw cnt">
          <div className={styles.projects_header}>
            <h2 ref={projectsTitleRef}>{projectsData.sectionTitle}</h2>
            {/* Potential projects count or view-all link could go here */}
          </div>
          <div className={styles.projects_list}>
            {projectsData.items.map((item, index) => (
              <div 
                key={item.id} 
                ref={projectItemContainersRef.current[index]} 
                className={styles.project_item}
              >
                <div className="cCover cnt_prj_im">
                  {allAssetsReady && (
                    <Base 
                      src={item.src}
                      type={item.type}
                      triggerElementRef={projectItemContainersRef.current[index]}
                      mediaElementRef={projectMediaElementsRef.current[index]}
                    />
                  )}
                  {/* Static placeholder image for SEO / no-webgl (could use LazyMedia or Next/Image) */}
                  {item.type === 'image' && (
                    <LazyMedia src={item.src} alt={item.title} className={styles.project_media_placeholder} />
                  )}
                </div>
                <div className={styles.project_meta}>
                  <h3 ref={projectMediaElementsRef.current[index]} className="Awrite">
                    {item.title}
                  </h3>
                  <Link href={item.link} className={styles.project_link}>View Case Study</Link>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.projects_footer}>
            <Link href="/projects" ref={projectsViewAllRef} className={styles.view_all}>
              View All Projects
            </Link>
          </div>
        </div>
      </section>

      {/* ABOUT Section */}
      <section ref={aboutRef} className={styles.home_about}>
        <div className="c-vw cnt">
          <div className={styles.about_content}>
            <h2 className={styles.about_title}>
              <span ref={aboutTitle1InteractionRef} className="Atitle">
                <span className="cCover">
                  {allAssetsReady && fonts[aboutData.fontKey] && (
                    <TtA 
                      text={aboutData.titleLine1}
                      fontJson={fonts[aboutData.fontKey].json}
                      fontTexture={fonts[aboutData.fontKey].texture}
                      ioRefSelf={aboutTitle1IoRef}
                      isVisible={aboutInView}
                      className={styles.about_title_canvas}
                    />
                  )}
                  <span className="Oiel">{aboutData.titleLine1}</span>
                </span>
              </span>
              <br />
              <span ref={aboutTitle2InteractionRef} className="Atitle">
                <span className="cCover">
                  {allAssetsReady && fonts[aboutData.fontKey] && (
                    <TtA 
                      text={aboutData.titleLine2}
                      fontJson={fonts[aboutData.fontKey].json}
                      fontTexture={fonts[aboutData.fontKey].texture}
                      ioRefSelf={aboutTitle2IoRef}
                      isVisible={aboutInView}
                      className={styles.about_title_canvas}
                    />
                  )}
                  <span className="Oiel">{aboutData.titleLine2}</span>
                </span>
              </span>
            </h2>
            <p ref={aboutTextContentRef} className="Awrite">
              {aboutData.text}
            </p>
            <Link href={aboutData.link} ref={aboutReadMoreRef} className={styles.about_readmore}>
              Read more
            </Link>
          </div>
          <div className={styles.about_media}>
            <div className="cCover about_image_container">
              {allAssetsReady && (
                <Base 
                  src={aboutData.imageSrc}
                  type="image"
                  triggerElementRef={aboutImageInteractionRef}
                  mediaElementRef={aboutImageMediaRef}
                />
              )}
              {/* Static about image as fallback */}
              <LazyMedia src={aboutData.imageSrc} alt="About Eva Sánchez" className={styles.about_image_placeholder} />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
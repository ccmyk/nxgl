// app/pages/about/page.jsx
'use client';

import React from 'react';
import styles from './page.module.pcss';
import { useWebGL } from '@/contexts/WebGLContext';
import TtA from '@/components/webgl/TtA';

export default function AboutPage() {
  const { fonts, isInitialized, assetsLoaded } = useWebGL();
  const allAssetsReady = isInitialized && assetsLoaded;

  // About page content (more detailed than home snippet)
  const titleLine1 = "Interactive Designer,";
  const titleLine2 = "Speaker & Teacher";
  const paragraph1 = "Eva Sánchez Clemente is an interactive designer specializing in the intersection of graphic design and web animation. She brings brand identities to life through unique, immersive digital experiences. Eva's work ranges from website art direction to experimental web-based projects that push creative boundaries.";
  const paragraph2 = "With a deep enthusiasm for typography and motion, Eva often shares her knowledge as a speaker and educator. Her approach blends visual storytelling with cutting-edge front-end techniques, resulting in engaging user experiences. Eva has collaborated with agencies and studios to craft award-winning digital content.";

  // Use default font for WebGL text effect
  const fontKey = 'default';
  const fontJson = fonts[fontKey]?.json;
  const fontTexture = fonts[fontKey]?.texture;

  return (
    <div className={styles.about_page}>
      <section className={styles.about_intro}>
        <div className="c-vw cnt">
          <h1 className={styles.about_heading}>
            <div className="cCover">
              {allAssetsReady && fontJson && fontTexture && (
                <TtA 
                  text={titleLine1 + ' ' + titleLine2}
                  fontJson={fontJson}
                  fontTexture={fontTexture}
                  isVisible={true}
                  ioRefSelf={null}
                  className={styles.about_heading_canvas}
                />
              )}
              <span className="Oiel">{titleLine1} {titleLine2}</span>
            </div>
          </h1>
          <p>{paragraph1}</p>
          <p>{paragraph2}</p>
        </div>
      </section>
    </div>
  );
}
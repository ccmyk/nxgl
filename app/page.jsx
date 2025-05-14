'use client';

import AnimatedText from '@/components/shared/AnimatedText';
import LazyMedia from '@/components/shared/LazyMedia';
import Bg from '@/components/webgl/Bg';
import Base from '@/components/webgl/Base';
import Tt from '@/components/webgl/Tt';
import TtF from '@/components/webgl/TtF';
import styles from './page.module.pcss';

export default function HomePage() {
  return (
    <div className={styles.container}>
      <Bg />
      <Base />
      <Tt />
      <TtF />
      <section className={styles.hero}>
        <AnimatedText text="Chris Hall" className="hero-title" />
        <LazyMedia src="/videos/hero.mp4" type="video" />
      </section>
      <section className={styles.projects}>...</section>
      <section className={styles.about}>...</section>
    </div>
  );
}
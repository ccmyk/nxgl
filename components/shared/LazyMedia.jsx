// components/shared/LazyMedia.jsx
'use client';

import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import styles from './LazyMedia.module.pcss';

export default function LazyMedia({ src, type }) {
  const { ref, isVisible } = useIntersectionObserver();

  return (
    <div ref={ref} className={styles.media}>
      {isVisible && (type === 'video' ? <video src={src} autoPlay muted loop /> : <img src={src} />)}
    </div>
  );
}
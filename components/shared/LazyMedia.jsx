// components/shared/LazyMedia.jsx
'use client';

import React, { useRef, useEffect, useState, forwardRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import styles from './LazyMedia.module.pcss'; // We'll create this next

const LazyMedia = forwardRef(({
  src,
  type = 'image', // 'image' or 'video'
  alt = '',
  aspectRatio, // e.g., "16/9" or "720/540"
  className = '',
  ioOptions = { threshold: 0.1 }, // When 10% of the item is visible
  onLoaded, // Optional callback when media is loaded
  ...props // Spread other props like autoPlay, loop, muted for video
}, ref) => {
  const elementRef = useRef(null); // Ref for the IO target (usually the wrapper div)
  const [isInView] = useIntersectionObserver(elementRef, ioOptions, true); // Freeze once visible
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    if (isInView && src && !currentSrc) {
      setCurrentSrc(src); // Set src to trigger loading when in view
    }
  }, [isInView, src, currentSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoaded) {
      onLoaded();
    }
  };

  // Calculate paddingBottom for aspect ratio
  let paddingBottom = '56.25%'; // Default to 16:9
  if (aspectRatio) {
    const [width, height] = aspectRatio.split('/').map(Number);
    if (width && height) {
      paddingBottom = `${(height / width) * 100}%`;
    }
  }

  return (
    <div
      ref={elementRef}
      className={`${styles.lazyMediaWrapper} ${isLoaded ? styles.loaded : ''} ${className}`}
      style={{ paddingTop: paddingBottom }} // Aspect ratio padding
    >
      {currentSrc && (
        type === 'image' ? (
          <img
            ref={ref} // Forwarded ref
            src={currentSrc}
            alt={alt}
            onLoad={handleLoad}
            className={styles.mediaContent}
            loading="lazy" // Native browser lazy loading as a fallback/enhancement
            {...props}
          />
        ) : (
          <video
            ref={ref} // Forwarded ref
            src={currentSrc}
            onLoadedData={handleLoad} // Use onLoadedData for video
            className={styles.mediaContent}
            playsInline // Important for mobile
            muted // Default to muted for autoplay scenarios
            loop // Default to loop for background/preview videos
            autoPlay // Autoplay when src is set and in view
            {...props} // Allow overriding defaults like controls, autoPlay, loop, muted
          />
        )
      )}
      {!isLoaded && <div className={styles.placeholder}></div>} {/* Optional placeholder */}
    </div>
  );
});

LazyMedia.displayName = 'LazyMedia';
export default LazyMedia;

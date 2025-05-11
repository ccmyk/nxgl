// components/shared/LazyMedia.jsx
'use client';

import React, { useRef, useEffect, useState, forwardRef } from 'react';
import Image from 'next/image'; // Import Next.js Image
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import styles from './LazyMedia.module.pcss';

const LazyMedia = forwardRef(({
  src,
  type = 'image',
  alt = '',
  aspectRatio,
  className = '',
  ioOptions = { threshold: 0.1 },
  onLoaded,
  // For next/image - required for external URLs or if not using static import
  width: imgWidth, // Pass width if known, for next/image
  height: imgHeight, // Pass height if known, for next/image
  priority = false, // For LCP images
  layout, // 'intrinsic', 'responsive', 'fill', 'fixed'
  objectFit, // For next/image when layout='fill'
  ...props
}, ref) => {
  const elementRef = useRef(null);
  const [isInView] = useIntersectionObserver(elementRef, ioOptions, true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(null);

  useEffect(() => {
    if (isInView && src && !currentSrc) {
      setCurrentSrc(src);
    }
  }, [isInView, src, currentSrc]);

  const handleLoad = () => {
    setIsLoaded(true);
    if (onLoaded) {
      onLoaded();
    }
  };

  let paddingBottom = '56.25%'; // Default 16:9
  if (aspectRatio) {
    const [arWidth, arHeight] = aspectRatio.split('/').map(Number);
    if (arWidth && arHeight) {
      paddingBottom = `${(arHeight / arWidth) * 100}%`;
    }
  }

  // For next/image, if layout is 'fill', the parent needs position relative.
  // The wrapper provides this and the aspect ratio.
  const wrapperClasses = `${styles.lazyMediaWrapper} ${isLoaded ? styles.loaded : ''} ${className}`;

  return (
    <div
      ref={elementRef}
      className={wrapperClasses}
      style={type === 'image' && layout !== 'fill' ? { paddingTop: paddingBottom } : { position: 'relative', width: '100%', height: '100%' }} // Adjust style for next/image fill
    >
      {currentSrc && (
        type === 'image' ? (
          <Image
            ref={ref} // next/image doesn't directly accept ref for the <img> tag.
                     // If ref is crucial for the <img> itself (e.g., for WebGL texture source),
                     // you might need to fall back to <img> or use a more complex setup.
                     // For now, assuming ref is for the wrapper or not strictly needed on <img> by Base.jsx
            src={currentSrc}
            alt={alt}
            onLoad={handleLoad} // next/image uses onLoadingComplete or onLoad
            onError={() => console.error("LazyMedia: Failed to load image", currentSrc)}
            className={styles.mediaContent} // For styling the Image component itself
            priority={priority}
            // Provide width/height if not using layout="fill" and src is external/dynamic
            // If src is statically imported, Next.js infers width/height.
            width={layout !== 'fill' ? (imgWidth || (aspectRatio ? 720 : undefined)) : undefined} // Example default if aspect known
            height={layout !== 'fill' ? (imgHeight || (aspectRatio ? parseInt(paddingBottom,10)/100 * 720 : undefined)) : undefined} // Example default
            layout={layout || "fill"} // Default to fill, parent must be relative
            objectFit={objectFit || "cover"} // Common for fill
            // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" // Example sizes attribute
            {...(layout === 'fill' ? {fill: true} : {})} // Spread fill prop if layout is fill
            {...props}
          />
        ) : (
          <video
            ref={ref}
            src={currentSrc}
            onLoadedData={handleLoad}
            className={styles.mediaContent}
            playsInline
            muted
            loop
            autoPlay
            {...props}
          />
        )
      )}
      {!isLoaded && type === 'image' && <div className={styles.placeholder}></div>} {/* Placeholder for images */}
    </div>
  );
});

LazyMedia.displayName = 'LazyMedia';
export default LazyMedia;

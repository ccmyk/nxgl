// components/layout/Loader.jsx
'use client'; // Will need hooks for animation later

import React, { useRef } from 'react';
import styles from './Loader.module.pcss';
// import { useTextAnimation } from '@/hooks/useTextAnimation'; // Import later

export default function Loader({ isVisible = true }) { // Assume visibility controlled by prop
  const h1Ref = useRef(null);
  const h2Ref = useRef(null);

  // Apply animation hooks later based on visibility or mount
  // useTextAnimation(h1Ref, isVisible, { params: { delay: /* Get from original timing */ } });
  // useTextAnimation(h2Ref, isVisible, { params: { delay: /* Get from original timing */ } });

  if (!isVisible) return null; // Don't render if not visible

  return (
    // Using class names from module
    <div className={styles.loader}>
      <div className={styles.loader_bg}></div>
      <div className={`${styles.loader_cnt} ${styles.c_vw}`}> {/* Compose classes */}
        {/* Numeral will be animated via GSAP on a state/ref later */}
        <div className={styles.loader_tp}>000</div>
        <div className={styles.loader_bp}>
          {/* Apply refs for text animation hook */}
          <h1 ref={h1Ref} data-params=".8"> {/* Keep data-params if hook uses it */}
            eva sánchez clemente {/* Plain text */}
          </h1>
          <h2 ref={h2Ref} data-params=".8">
            interactive designer_ portfolio {/* Plain text */}
          </h2>
        </div>
      </div>
       {/* Note: The #glLoader canvas is separate and handled by WebGLContext/LoaderEffect */}
    </div>
  );
}
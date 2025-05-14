// hooks/useAnimatedText.js

import { useEffect, useRef } from 'react';
import SplitType from 'split-type';
import gsap from 'gsap';

export function useAnimatedText(text) {
  const ref = useRef(null);

  useEffect(() => {
    const split = new SplitType(ref.current, { types: 'chars, words' });
    gsap.from(split.chars, { opacity: 0, stagger: 0.05, ease: 'power2.inOut' });
  }, [text]);

  return ref;
}
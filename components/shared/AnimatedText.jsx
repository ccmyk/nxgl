// components/AnimatedText.jsx
'use client';

import React, { useRef } from 'react';
import { useAnimatedText } from '@/hooks/useAnimatedText';

export default function AnimatedText({
  text = '',
  className = '',
  params = '1.6',
  tag: Tag = 'div',
  splitType = 'chars,words',
  initialState = 'hidden',
  loop = false,
  isActive = true,
  fakeCount = 2,
  times = [],
}) {
  const ref = useRef(null);

  useAnimatedText(ref, isActive, {
    splitType,
    initialState,
    loop,
    times,
    params: { delay: parseFloat(params) || 0 },
    fakeCount,
  });

  return (
    <Tag
      ref={ref}
      className={`Awrite ${className}`.trim()}
      data-params={params}
      style={{ opacity: initialState === 'hidden' ? 0 : 1 }}
    >
      {text}
    </Tag>
  );
}

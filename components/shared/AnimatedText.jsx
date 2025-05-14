// components/AnimatedText.jsx

'use client';

import { useAnimatedText } from '@/hooks/useAnimatedText';

export default function AnimatedText({ text, className }) {
  const ref = useAnimatedText(text);

  return <div ref={ref} className={className} />;
}

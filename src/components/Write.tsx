// src/components/Write.tsx
'use client';
import { useRef } from 'react';
import { useWriteAnim } from '@/hooks/useWriteAnim';

type WriteProps = {
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  children?: React.ReactNode;
  [key: `data-${string}`]: any;
};

export function Write({ as = 'span', children, ...props }: WriteProps) {
  const Tag = as;
  const elRef = useRef<HTMLElement>(null);

  useWriteAnim(elRef);

  return (
    <Tag ref={elRef} {...props}>
      {children}
    </Tag>
  );
}

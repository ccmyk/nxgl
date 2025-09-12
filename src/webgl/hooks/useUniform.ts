// src/webgl/hooks/useUniform.ts
'use client';

import { useMemo } from 'react';

export function useUniform<T>(value: T) {
  return useMemo(() => ({ value } as any), [value]);
}
// src/hooks/useAnimBus.ts
'use client';

import { create } from 'zustand';

type Detail = { el?: HTMLElement | null; state: number; style?: number; params?: number[] };

type Bus = {
  listeners: Set<(d: Detail) => void>;
  on: (fn: (d: Detail) => void) => () => void;
  dispatch: (d: Detail) => void;
};

export const useAnimBus = create<Bus>(() => ({
  listeners: new Set(),
  on: (fn) => {
    useAnimBus.getState().listeners.add(fn);
    return () => useAnimBus.getState().listeners.delete(fn);
  },
  dispatch: (d) => {
    useAnimBus.getState().listeners.forEach((l) => l(d));
  }
}));
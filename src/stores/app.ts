// src/stores/app.ts
'use client';

import { create } from 'zustand';

type Screen = { w: number; h: number };

type AppState = {
  base: string;
  template: string;
  url: string;
  device: number;
  isTouch: boolean;
  screen: Screen;
  speed: number;
  isLoad: number;
  lenis?: any;

  setBase: (s: string) => void;
  setTemplate: (t: string) => void;
  setUrl: (u: string) => void;
  setDevice: (d: number) => void;
  setIsTouch: (b: boolean) => void;
  setScreen: (w: number, h: number) => void;
  setSpeed: (v: number) => void;
  setIsLoad: (v: number) => void;
  setLenis: (l: any) => void;
};

export const useAppStore = create<AppState>((set) => ({
  base: '/',
  template: 'home',
  url: '/',
  device: 0,
  isTouch: false,
  screen: { w: 0, h: 0 },
  speed: 0,
  isLoad: 1,

  setBase: (base) => set({ base }),
  setTemplate: (template) => set({ template }),
  setUrl: (url) => set({ url }),
  setDevice: (device) => set({ device }),
  setIsTouch: (isTouch) => set({ isTouch }),
  setScreen: (w, h) => set({ screen: { w, h } }),
  setSpeed: (speed) => set({ speed }),
  setIsLoad: (isLoad) => set({ isLoad }),
  setLenis: (lenis) => set({ lenis })
}));
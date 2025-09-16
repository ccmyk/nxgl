// src/webgl/stores/ogl.ts
"use client";

import { create } from "zustand";

type IO = {
	id: string;
	onResize?: () => void;
	onTick?: (t: number) => void;
	changeState?: (st: number) => void;
};

type OGLState = {
	ios: Map<string, IO>;
	register: (io: IO) => void;
	unregister: (id: string) => void;
	resizeAll: () => void;
	changeSlides: (st: number) => void;
};

export const useOGLStore = create<OGLState>((set, get) => ({
	ios: new Map(),
	register: (io) => {
		const m = new Map(get().ios);
		m.set(io.id, io);
		set({ ios: m });
	},
	unregister: (id) => {
		const m = new Map(get().ios);
		m.delete(id);
		set({ ios: m });
	},
	resizeAll: () => {
		get().ios.forEach((io) => io.onResize?.());
	},
	changeSlides: (st) => {
		get().ios.forEach((io) => io.changeState?.(st));
	},
}));

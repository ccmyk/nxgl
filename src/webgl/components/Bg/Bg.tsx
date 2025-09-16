// src/webgl/components/Bg/Bg.tsx
"use client";

import { Mesh, Program, Renderer, Triangle, Vec2 } from "ogl";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsapSetup";
import { useIO } from "@/webgl/hooks/useIO";
import { useOGLStore } from "@/webgl/stores/ogl";

import fragmentSrc from "./Bg.fragment.glsl?raw";
import vertexSrc from "./Bg.vertex.glsl?raw";

// Utility functions from original project, can be moved to a shared utils file
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const clamp = (min: number, max: number, num: number) =>
	Math.min(Math.max(num, min), max);

type Props = {
	id: string;
	/** The DOM element that triggers the scroll-based animation. */
	scrollTarget: HTMLElement | null;
	/** Callback to inform parent of animation state changes (e.g., for theme color swaps). */
	onStateChange?: (state: "dark" | "light") => void;
	/** DOM element to append the canvas to. Defaults to document.body */
	behind?: HTMLElement | null;
};

export function Bg({ id, scrollTarget, onStateChange, behind }: Props) {
	const { register, unregister } = useOGLStore();
	const [isActive, setIsActive] = useState(false);

	// Refs for OGL objects, GSAP timelines, and state
	const rendererRef = useRef<Renderer | null>(null);
	const anims = useRef<{ scroll?: gsap.core.Timeline }>({});
	const scrollState = useRef({
		current: 0,
		limit: 0,
		start: 0,
		prog: 0,
		progt: 0,
	});
	const scrollTargetRef = useRef(scrollTarget);

	// Use IntersectionObserver to activate/deactivate the component's render loop
	useIO(id, scrollTargetRef, (isVisible, entry) => {
		// The original logic plays/reverses the animation when stopping
		if (!isVisible && anims.current.scroll) {
			if (entry.boundingClientRect.y < -1) {
				anims.current.scroll.reverse();
			} else {
				anims.current.scroll.play();
			}
		}
		setIsActive(isVisible);
	});

	// Main setup effect, runs once on mount.
	useEffect(() => {
		const parentEl = behind ? behind.parentElement : document.body;
		if (!parentEl) return;

		// 1. Create Renderer and OGL objects
		const renderer = new Renderer({
			alpha: true,
			dpr: Math.min(window.devicePixelRatio, 2),
			width: window.innerWidth,
			height: window.innerHeight,
		});
		rendererRef.current = renderer;
		const { gl } = renderer;
		gl.canvas.id = "glBg";
		parentEl.insertBefore(gl.canvas, behind || null);

		const geometry = new Triangle(gl);
		const program = new Program(gl, {
			vertex: vertexSrc,
			fragment: fragmentSrc,
			uniforms: {
				uTime: { value: 0 },
				uStart0: { value: 1 },
				uStart1: { value: 0.5 },
				uStart2: { value: 1 },
				uStartX: { value: 0 },
				uStartY: { value: 0.1 },
				uMultiX: { value: -0.4 },
				uMultiY: { value: 0.45 },
				uResolution: {
					value: new Vec2(gl.canvas.offsetWidth, gl.canvas.offsetHeight),
				},
			},
		});

		const mesh = new Mesh(gl, { geometry, program });

		// 2. Replicate the complex GSAP timeline, including DOM side effects
		anims.current.scroll = gsap
			.timeline({ paused: true })
			.fromTo(
				".home_about .cnt_tp",
				{ opacity: 1 },
				{ opacity: 0, duration: 0.15 },
				0.9,
			)
			.fromTo(
				program.uniforms.uStart0,
				{ value: 0 },
				{ value: 1, duration: 0.6, ease: "power2.inOut" },
				0,
			)
			.fromTo(
				program.uniforms.uStartX,
				{ value: 0 },
				{ value: -0.1, duration: 2, ease: "power2.inOut" },
				0,
			)
			.fromTo(
				program.uniforms.uMultiX,
				{ value: -0.4 },
				{ value: 0.1, duration: 2, ease: "power2.inOut" },
				0,
			)
			.fromTo(
				program.uniforms.uStartY,
				{ value: 0.1 },
				{ value: 0.95, duration: 2, ease: "power2.inOut" },
				0,
			)
			.fromTo(
				program.uniforms.uMultiY,
				{ value: 0.45 },
				{ value: 0.3, duration: 2, ease: "power2.inOut" },
				0,
			)
			.fromTo(
				program.uniforms.uStart2,
				{ value: 1 },
				{ value: 0, duration: 1, ease: "power2.inOut" },
				0.6,
			)
			.fromTo(
				".nav",
				{ "--dark": "#F8F6F2", "--light": "#000" },
				{
					"--dark": "#000",
					"--light": "#F8F6F2",
					duration: 0.5,
					onStart: () => onStateChange?.("light"),
					onReverseComplete: () => onStateChange?.("dark"),
				},
				0.1,
			)
			.progress(1); // Start at the end state (light theme)

		const handleResize = () => {
			renderer.setSize(window.innerWidth, window.innerHeight);
			program.uniforms.uResolution.value = [
				gl.canvas.offsetWidth,
				gl.canvas.offsetHeight,
			];
			if (scrollTargetRef.current) {
				const rect = scrollTargetRef.current.getBoundingClientRect();
				scrollState.current.start =
					rect.top + window.scrollY - window.innerHeight;
				scrollState.current.limit = rect.height;
			}
		};

		handleResize();

		// 3. Register with global store for updates
		register({
			id,
			onResize: handleResize,
			onTick: (time) => {
				program.uniforms.uTime.value = time || 0;
				if (isActive) {
					const sState = scrollState.current;
					sState.current = window.scrollY - sState.start;
					sState.current = clamp(0, sState.limit, sState.current);
					sState.progt = sState.current / sState.limit;
					sState.prog = lerp(sState.prog, sState.progt, 0.045);
					// Link scroll progress to timeline progress (1 - prog to play backwards on scroll down)
					anims.current.scroll?.progress(1 - sState.prog);
				}
				renderer.render({ scene: mesh });
			},
		});

		return () => {
			unregister(id);
			anims.current.scroll?.kill();
			renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
			gl.canvas.remove();
		};
	}, [
		id,
		behind,
		scrollTargetRef,
		onStateChange,
		register,
		unregister,
		isActive,
	]);

	return null;
}

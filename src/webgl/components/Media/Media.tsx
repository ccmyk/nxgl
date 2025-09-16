// src/webgl/components/Media/Media.tsx
"use client";

import { Mesh, Program, Renderer, Texture, Triangle, Vec2 } from "ogl";
import { useEffect, useRef, useState } from "react";
import { gsap } from "@/lib/gsapSetup";
import { useIO } from "@/webgl/hooks/useIO";
import { useImage, useVideo } from "@/webgl/hooks/useTexture";
import { useOGLStore } from "@/webgl/stores/ogl";

import fragmentSrc from "./Media.fragment.glsl?raw";
import vertexSrc from "./Media.vertex.glsl?raw";

// Utility functions from original project
const lerp = (a: number, b: number, t: number) => a * (1 - t) + b * t;
const clamp = (min: number, max: number, num: number) =>
	Math.min(Math.max(num, min), max);

type Props = {
	id: string;
	/** The DOM element to append the WebGL canvas into. */
	holder: HTMLElement | null;
	src: string;
	/** Inverts the direction of the reveal animation. Corresponds to data-op in original. */
	invert?: boolean;
	isTouch?: boolean;
};

export function Media({ id, holder, src, invert, isTouch }: Props) {
	const { register, unregister } = useOGLStore();

	const isVideo = src.endsWith(".mp4");
	const img = useImage(!isVideo ? src : undefined);
	const vid = useVideo(isVideo ? src : undefined, true);
	const media = isVideo ? vid : img;

	const [isActive, setIsActive] = useState(false);

	const rendererRef = useRef<Renderer | null>(null);
	const anims = useRef<{ scroll?: gsap.core.Timeline }>({});
	const interactionState = useRef({
		norm: [0, 0],
		end: [0, 0],
		ease: 0.06,
		bounds: { x: 0, y: 0, width: 0, height: 0 },
	});
	const scrollState = useRef({
		current: 0,
		limit: 0,
		start: 0,
		prog: 0,
		progt: 0,
		lerp: 0.065,
	});
	const holderRef = useRef(holder);

	useIO(id, holderRef, (isVisible) => {
		setIsActive(isVisible);
		if (isVisible && media instanceof HTMLVideoElement) media.play();
		if (!isVisible && media instanceof HTMLVideoElement) media.pause();
	});

	// Main setup effect
	useEffect(() => {
		if (!holderRef.current || !media) return;
		const holder = holderRef.current;

		const renderer = new Renderer({
			alpha: true,
			dpr: Math.max(window.devicePixelRatio, 2),
			width: holder.clientWidth,
			height: holder.clientHeight,
		});
		rendererRef.current = renderer;
		const { gl } = renderer;
		gl.canvas.classList.add("glMedia");
		holder.appendChild(gl.canvas);

		const geometry = new Triangle(gl);
		const texture = new Texture(gl, { image: media, generateMipmaps: false });

		const program = new Program(gl, {
			vertex: vertexSrc,
			fragment: fragmentSrc,
			uniforms: {
				uTime: { value: 0 },
				uStart: { value: invert ? -0.8 : 0.8 },
				uStart1: { value: 0 },
				uCover: { value: new Vec2(holder.clientWidth, holder.clientHeight) },
				uTextureSize: { value: new Vec2(1, 1) },
				tMap: { value: texture },
				uMouse: { value: new Vec2(0, 0) },
			},
			transparent: true,
		});

		const mesh = new Mesh(gl, { geometry, program });

		// Replicate scroll-reveal animation
		anims.current.scroll = gsap.timeline({ paused: true }).fromTo(
			program.uniforms.uStart,
			{ value: invert ? -0.8 : 0.8 },
			{
				value: 0,
				ease: "power2.inOut",
				onComplete: () => {
					scrollState.current.prog = 1; // Lock it
				},
			},
		);

		const handleResize = () => {
			const rect = holder.getBoundingClientRect();
			interactionState.current.bounds = rect;
			renderer.setSize(rect.width, rect.height);
			program.uniforms.uCover.value = [rect.width, rect.height];

			const scrollRect = holder.getBoundingClientRect();
			const h = window.innerHeight;
			const fix = h * 0.2;
			scrollState.current.start = scrollRect.top + window.scrollY - h + fix;
			scrollState.current.limit = scrollRect.height + (h - h * 0.7) + fix;
		};

		handleResize();

		register({
			id,
			onResize: handleResize,
			onTick: (time) => {
				program.uniforms.uTime.value = time || 0;

				// Handle scroll animation
				if (scrollState.current.prog < 1) {
					const sState = scrollState.current;
					sState.current = window.scrollY - sState.start;
					sState.current = clamp(0, sState.limit, sState.current);
					sState.progt = sState.current / sState.limit;
					sState.prog = lerp(sState.prog, sState.progt, sState.lerp);
					anims.current.scroll?.progress(sState.prog);
				}

				if (isActive) {
					// Handle mouse animation
					const iState = interactionState.current;
					iState.end[0] = lerp(iState.end[0], iState.norm[0], iState.ease);
					program.uniforms.uMouse.value = iState.end;
				}

				// Update video texture if needed
				if (
					media instanceof HTMLVideoElement &&
					media.readyState >= media.HAVE_ENOUGH_DATA
				) {
					texture.needsUpdate = true;
					program.uniforms.uTextureSize.value = [
						media.videoWidth,
						media.videoHeight,
					];
				} else if (media instanceof HTMLImageElement) {
					program.uniforms.uTextureSize.value = [
						media.naturalWidth,
						media.naturalHeight,
					];
				}

				renderer.render({ scene: mesh });
			},
		});

		return () => {
			unregister(id);
			renderer.gl.getExtension("WEBGL_lose_context")?.loseContext();
			gl.canvas.remove();
		};
	}, [id, holder, media, invert, register, unregister, isActive]);

	// Interaction Effect
	useEffect(() => {
		if (!holderRef.current) return;
		const holder = holderRef.current;

		const handleMove = (e: MouseEvent | TouchEvent) => {
			interactionState.current.ease = 0.03;
			const clientX = "touches" in e ? e.touches[0]?.clientX : e.clientX;
			if (clientX === undefined) return;

			const bounds = interactionState.current.bounds;
			interactionState.current.norm[0] =
				(clientX - bounds.left) / bounds.width - 0.5;
		};

		const handleLeave = () => {
			interactionState.current.ease = 0.01;
			interactionState.current.norm[0] = 0;
		};

		if (!isTouch) {
			holder.addEventListener("mousemove", handleMove);
			holder.addEventListener("mouseleave", handleLeave);
		} else {
			holder.addEventListener("touchmove", handleMove, { passive: true });
			holder.addEventListener("touchend", handleLeave, { passive: true });
		}

		return () => {
			if (!isTouch) {
				holder.removeEventListener("mousemove", handleMove);
				holder.removeEventListener("mouseleave", handleLeave);
			} else {
				holder.removeEventListener("touchmove", handleMove);
				holder.removeEventListener("touchend", handleLeave);
			}
		};
	}, [isTouch]);

	return null;
}

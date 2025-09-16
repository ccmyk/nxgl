// src/webgl/hooks/useTexture.ts
"use client";

import { useEffect, useState } from "react";

export function useImage(url?: string) {
	const [img, setImg] = useState<HTMLImageElement | null>(null);
	useEffect(() => {
		if (!url) return;
		const i = new Image();
		i.crossOrigin = "";
		i.onload = () => setImg(i);
		i.src = url;
	}, [url]);
	return img;
}

export function useVideo(url?: string, loop = true) {
	const [vid, setVid] = useState<HTMLVideoElement | null>(null);
	useEffect(() => {
		if (!url) return;
		const v = document.createElement("video");
		v.muted = true;
		v.autoplay = true;
		v.loop = loop;
		v.playsInline = true as any;
		v.oncanplay = () => setVid(v);
		v.src = url;
		v.play().catch(() => {});
	}, [url, loop]);
	return vid;
}

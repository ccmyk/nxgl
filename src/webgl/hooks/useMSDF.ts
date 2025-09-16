// src/webgl/hooks/useMSDF.ts
"use client";

import { useEffect, useState } from "react";

export function useMSDF(mapPngUrl: string, jsonUrl: string) {
	const [png, setPng] = useState<HTMLImageElement | null>(null);
	const [json, setJson] = useState<any>(null);

	useEffect(() => {
		let abort = false;
		const img = new Image();
		img.crossOrigin = "";
		img.onload = () => {
			if (!abort) setPng(img);
		};
		img.src = mapPngUrl;
		fetch(jsonUrl)
			.then((r) => r.json())
			.then((j) => {
				if (!abort) setJson(j);
			});
		return () => {
			abort = true;
		};
	}, [mapPngUrl, jsonUrl]);

	return { png, json };
}

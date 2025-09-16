// src/webgl/hooks/useShaderText.ts
"use client";

import { useEffect, useState } from "react";

export function useShaderText(url?: string) {
	const [src, setSrc] = useState<string | null>(null);
	useEffect(() => {
		let abort = false;
		if (!url) return;
		fetch(url)
			.then((r) => r.text())
			.then((txt) => {
				if (!abort) setSrc(txt);
			})
			.catch(() => {
				if (!abort) setSrc(null);
			});
		return () => {
			abort = true;
		};
	}, [url]);
	return src;
}

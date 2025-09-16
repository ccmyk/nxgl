"use client";

import { useEffect, useRef, useState } from "react";
import { useAnimBus } from "@/hooks/useAnimBus";

export function Nav(props: { html: string }) {
	const ref = useRef<HTMLDivElement | null>(null);
	const [isOpen, setIsOpen] = useState(0);
	const bus = useAnimBus();

	useEffect(() => {
		if (!ref.current) return;
		const el = ref.current.querySelector(".nav") as HTMLElement | null;
		if (!el) return;

		const c = el.querySelector(".nav_logo") as HTMLElement | null;
		const city = el.querySelector(".nav_clock_p") as HTMLElement | null;
		const h = el.querySelector(".nav_clock_h") as HTMLElement | null;
		const m = el.querySelector(".nav_clock_m") as HTMLElement | null;
		const a = el.querySelector(".nav_clock_a") as HTMLElement | null;
		const links = Array.from(
			el.querySelectorAll(".nav_right a"),
		) as HTMLElement[];

		[c, city, h, m, a].forEach(
			(node) => node && bus.dispatch({ state: 0, style: 0, el: node }),
		);
		el.style.opacity = "1";
		[c, city, h, m, a].forEach(
			(node) => node && bus.dispatch({ state: 1, style: 0, el: node }),
		);
		links.forEach((lnk) => {
			bus.dispatch({ state: 0, style: 0, el: lnk });
			bus.dispatch({ state: 1, style: 0, el: lnk });
			lnk.onmouseenter = () => bus.dispatch({ state: 1, style: 0, el: lnk });
		});
	}, [bus]);

	return <div ref={ref} dangerouslySetInnerHTML={{ __html: props.html }} />;
}

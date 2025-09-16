// src/providers/AppProviders.tsx
"use client";

import { ScrollProvider } from "@/providers/ScrollProvider";
import { TransitionProvider } from "@/providers/TransitionProvider";
import { OGLRoot } from "@/webgl/providers/OGLRoot";

export function AppProviders(props: { children: React.ReactNode }) {
	return (
		<ScrollProvider>
			<TransitionProvider>
				{props.children}
				<OGLRoot />
			</TransitionProvider>
		</ScrollProvider>
	);
}

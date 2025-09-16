// src/lib/gsapSetup.ts
"use client";
import gsap from "gsap";
import SplitText from "gsap/SplitText";

gsap.registerPlugin(SplitText);
export { gsap, SplitText };

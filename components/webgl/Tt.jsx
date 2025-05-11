// components/webgl/Tt.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Program, Mesh, Text as OGLText, Texture, Geometry, Vec2 } from 'ogl';
import gsap from 'gsap';
import SplitType from 'split-type'; // Ensure this is installed: pnpm add split-type
import { useWebGL } from '@/contexts/WebGLContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
// Assuming your shaders are correctly imported. If using raw-loader for .glsl:
import fragmentShaderSource from '@/shaders/tt/msdf.frag.glsl';
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl';
import { lerp, clamp } from '@/lib/math'; // Assuming math utils exist
import styles from './Tt.module.pcss'; // Import the CSS module

export default function Tt({
  text = "DEFAULT TEXT",
  fontKey = 'default', // Key to access font from WebGLContext.fonts
  interactionElementRef, // REQUIRED: Ref to the HTML element for mouse interaction (e.g., the h2 or span)
  ioRefSelf, // REQUIRED: Ref to the element triggering the IO (e.g., parent container or the interactionElementRef itself)
  isVisible = true, // Optional: External visibility control
  align = 'center',
  letterSpacing = -0.022,
  size = 5,
  width = undefined, // OGL Text width property
  color = [0, 0, 0], // Default to black [R, G, B] float values (0-1)
  animationParams = { durationIn: 0.8, durationPower: 2.0, delay: 0 }, // Includes base delay
  ioOptions = { threshold: 0.1 },
  className = '', // Allow passing additional classes for the wrapper (if any)
  glCanvasClassName = '', // Specific class for the canvas element itself
}) {
  const { gl, scene, camera, isInitialized: isWebGLInitialized, assetsLoaded, fonts } = useWebGL();
  const meshRef = useRef(null);
  const textDataRef = useRef(null); // Stores OGL Text instance data
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const splitInstanceRef = useRef(null); // For SplitType on interactionElementRef
  const revealAnimationRef = useRef(null); // GSAP timeline for reveal
  const interactionTimelineInRef = useRef(null); // GSAP timeline for mouse power in
  const interactionTimelineOutRef = useRef(null); // GSAP timeline for mouse power out
  const charBoundsRef = useRef([]); // Store character bounds for interaction

  const [interactionState, setInteractionState] = useState({
    targetCharIndex: -1,
    mouseXPercent: 0, // Mouse X relative to element width (-0.5 to 0.5)
    charPowers: [], // Lerped power for each char [0..1]
    targetCharPowers: [], // Target power for each char [0..1]
    lerpFactor: 0.06,
  });

  const fontData = fonts && fonts[fontKey] ? fonts[fontKey] : null;

  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true); // Freeze once visible
  const combinedIsActive = isWebGLInitialized && assetsLoaded && fontData && isVisible && isInView;

  // --- 1. Setup OGL Text Object and Mesh ---
  useEffect(() => {
    if (!gl || !scene || !fontData?.json || !fontData?.texture || !isWebGLInitialized || !text) {
      return;
    }

    let mesh, program, geometry;

    try {
      const oglText = new OGLText({
        font: fontData.json,
        text,
        width,
        align,
        letterSpacing,
        size,
        lineHeight: 1, // Adjust if multiline
      });
      textDataRef.current = oglText;

      geometry = new Geometry(gl, {
        position: { size: 3, data: oglText.buffers.position },
        uv: { size: 2, data: oglText.buffers.uv },
        id: { size: 1, data: oglText.buffers.id },
        index: { data: oglText.buffers.index },
      });
      geometry.computeBoundingBox(); // Important for centering
      geometryRef.current = geometry;

      const charCount = oglText.meta.chars.length || 1;
      // Ensure uPowers uniform array in shader matches charCount
      // The shader provided previously had fixed size arrays for uWidth/uHeight,
      // OGL Text handles this internally. We need uPowers for interaction.
      // The fragment shader should be updated if it uses PITO for array size.
      // For now, assume msdf.frag.glsl is generic or PITO is handled.

      program = new Program(gl, {
        vertex: vertexShaderSource,
        fragment: fragmentShaderSource, // Ensure this shader uses uPowers correctly
        uniforms: {
          tMap: { value: fontData.texture },
          uColor: { value: color }, // Text color [R, G, B]
          uAlpha: { value: 1.0 }, // Overall opacity, can be animated
          // MSDF uniforms
          uThreshold: { value: 0.05 }, // Adjust for MSDF rendering
          // Interaction uniforms
          uMouse: { value: new Vec2(0, 0) }, // For X offset based on mouse
          uPower: { value: 0.0 }, // Overall interaction strength (0-1)
          uHoveredCharIndex: { value: -1.0 }, // Index of hovered char
          // Initialize uPowers with default state (0.0 means no distortion from base)
          uPowers: { value: new Float32Array(charCount).fill(0.0) },
          // Reveal animation
          uRevealProgress: { value: 1.0 }, // 1 = hidden, 0 = shown
        },
        transparent: true,
        cullFace: null,
        depthWrite: false, // Usually false for text
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      // Center the text mesh based on its computed geometry width
      mesh.position.x = -oglText.width / 2;
      mesh.position.y = -oglText.height / 2 + oglText.height * 0.35; // Adjust Y for baseline alignment
      mesh.setParent(scene);
      meshRef.current = mesh;

      // Initialize interaction state arrays
      setInteractionState(prev => ({
        ...prev,
        charPowers: new Float32Array(charCount).fill(0.0),
        targetCharPowers: new Float32Array(charCount).fill(0.0),
      }));

      // console.log('Tt Initialized:', text);
    } catch (error) {
      console.error("Error initializing Tt:", text, error);
    }

    return () => {
      revealAnimationRef.current?.kill();
      interactionTimelineInRef.current?.kill();
      interactionTimelineOutRef.current?.kill();
      scene?.removeChild(meshRef.current);
      programRef.current?.gl?.deleteProgram(programRef.current.program);
      geometryRef.current?.dispose();
      // console.log("Tt Cleanup:", text);
    };
  }, [gl, scene, isWebGLInitialized, assetsLoaded, fontData, text, width, align, letterSpacing, size, color]);


  // --- 2. Setup Interaction Element (SplitType & Mouse Events) ---
  useEffect(() => {
    const interactionNode = interactionElementRef?.current;
    if (!interactionNode || !textDataRef.current || !programRef.current || !combinedIsActive) return;

    // GSAP Timelines for uPower (overall interaction strength)
    interactionTimelineInRef.current = gsap.timeline({ paused: true })
      .to(programRef.current.uniforms.uPower, { value: 1.0, duration: 0.36, ease: 'power2.out' });
    interactionTimelineOutRef.current = gsap.timeline({ paused: true })
      .to(programRef.current.uniforms.uPower, { value: 0.0, duration: 0.6, ease: 'power2.inOut', onComplete: () => {
        if(programRef.current) programRef.current.uniforms.uHoveredCharIndex.value = -1.0;
      }});

    // SplitType for character bounds
    let splitInstance;
    try {
      splitInstanceRef.current?.revert();
      splitInstance = new SplitType(interactionNode, { types: 'chars', tagName: 'span' });
      splitInstanceRef.current = splitInstance;

      const parentRect = interactionNode.getBoundingClientRect();
      const bounds = (splitInstance.chars || []).map((el, idx) => {
        el.dataset.charIndex = idx; // For debugging or direct CSS
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left - parentRect.left,
          width: rect.width,
          index: idx,
        };
      });
      charBoundsRef.current = bounds;
    } catch (e) {
      console.error("SplitType Error on Tt interaction element:", e, interactionNode);
      return;
    }

    const findHoveredChar = (mouseX) => {
      const relativeX = mouseX - interactionNode.getBoundingClientRect().left;
      for (const bound of charBoundsRef.current) {
        if (relativeX >= bound.left && relativeX < bound.left + bound.width) {
          return bound.index;
        }
      }
      return -1;
    };

    const handleInteractionMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const targetIndex = findHoveredChar(clientX);
      const relativeX = (clientX - interactionNode.getBoundingClientRect().left) / interactionNode.clientWidth;
      setInteractionState(prev => ({
          ...prev,
          targetCharIndex: targetIndex,
          mouseXPercent: clamp(relativeX - 0.5, -0.5, 0.5), // Center around 0
      }));
      if (programRef.current) {
        programRef.current.uniforms.uHoveredCharIndex.value = parseFloat(targetIndex);
      }
    };

    const handleInteractionEnter = (e) => {
      setInteractionState(prev => ({ ...prev, lerpFactor: 0.08 })); // Faster lerp
      interactionTimelineOutRef.current?.pause();
      interactionTimelineInRef.current?.restart(); // Play from start
      handleInteractionMove(e);
    };

    const handleInteractionLeave = () => {
      setInteractionState(prev => ({ ...prev, lerpFactor: 0.04, targetCharIndex: -1 })); // Slower lerp, reset
      interactionTimelineInRef.current?.pause();
      interactionTimelineOutRef.current?.restart();
    };

    interactionNode.addEventListener('mouseenter', handleInteractionEnter);
    interactionNode.addEventListener('mousemove', handleInteractionMove);
    interactionNode.addEventListener('mouseleave', handleInteractionLeave);
    // Add touch equivalents if desired, though complex hover might not translate well

    return () => {
      interactionNode.removeEventListener('mouseenter', handleInteractionEnter);
      interactionNode.removeEventListener('mousemove', handleInteractionMove);
      interactionNode.removeEventListener('mouseleave', handleInteractionLeave);
      splitInstanceRef.current?.revert();
      interactionTimelineInRef.current?.kill();
      interactionTimelineOutRef.current?.kill();
    };
  }, [interactionElementRef, combinedIsActive]); // Rerun if interaction element or active state changes

  // --- 3. Lerp and Update uPowers Uniform for Character Interaction ---
  useEffect(() => {
    if (!programRef.current || !textDataRef.current || !combinedIsActive) return;

    const currentPowers = [...interactionState.charPowers]; // Clone for modification
    const { targetCharIndex, lerpFactor } = interactionState;
    const charCount = textDataRef.current.meta.chars.length;

    if (currentPowers.length !== charCount) { // Ensure array is sized correctly
        setInteractionState(prev => ({
            ...prev,
            charPowers: new Float32Array(charCount).fill(0.0),
            targetCharPowers: new Float32Array(charCount).fill(0.0),
        }));
        return;
    }

    let needsUniformUpdate = false;

    // Calculate target powers (1 for hovered, decreasing for neighbors)
    const newTargetPowers = new Float32Array(charCount);
    for (let i = 0; i < charCount; i++) {
      let targetPower = 0.0; // Default: no distortion
      if (targetCharIndex !== -1) {
        const dist = Math.abs(i - targetCharIndex);
        // Example: Max power for hovered, 0.5 for adjacent, 0.25 for next, etc.
        targetPower = Math.max(0, 1.0 - dist * 0.3); // Adjust multiplier for spread
      }
      newTargetPowers[i] = targetPower;
    }

    // Lerp current powers towards new target powers
    const newPowers = new Float32Array(charCount);
    for (let i = 0; i < charCount; i++) {
      newPowers[i] = lerp(currentPowers[i], newTargetPowers[i], lerpFactor);
      if (Math.abs(newPowers[i] - currentPowers[i]) > 0.001) {
        needsUniformUpdate = true;
      }
    }

    if (needsUniformUpdate) {
      programRef.current.uniforms.uPowers.value = newPowers;
      setInteractionState(prev => ({ ...prev, charPowers: newPowers, targetCharPowers: newTargetPowers }));
    }
    if (programRef.current) {
        programRef.current.uniforms.uMouse.value.x = interactionState.mouseXPercent;
    }

  }, [interactionState, combinedIsActive, textDataRef]);

  // --- 4. Reveal Animation (uRevealProgress) ---
  useEffect(() => {
    if (!combinedIsActive || !programRef.current || revealAnimationRef.current?.isActive()) return;

    const { durationIn, delay: startDelay } = animationParams;
    const tl = gsap.timeline({ delay: startDelay });
    tl.fromTo(programRef.current.uniforms.uRevealProgress,
      { value: 1.0 }, // Start hidden
      { value: 0.0, duration: durationIn, ease: 'power3.out' } // Animate to shown
    );
    // Also animate overall interaction power (uPower) in, if desired
    tl.fromTo(programRef.current.uniforms.uPower,
      { value: 0.0 },
      { value: 0.5, duration: animationParams.durationPower || 1.0, ease: 'power2.inOut' }, // Default uPower after reveal
      0 // Start uPower animation with reveal
    );

    revealAnimationRef.current = tl;
    tl.play();

    // Add .act class to interaction element after animation (from legacy)
    if (interactionElementRef?.current) {
        gsap.delayedCall(startDelay + durationIn, () => {
            interactionElementRef.current.classList.add('act');
        });
    }

  }, [combinedIsActive, animationParams, interactionElementRef]);

  // The WebGL mesh is added to the shared scene from WebGLContext.
  // This component itself doesn't render a DOM element, unless you want a wrapper.
  // If you need a canvas specifically for this, you'd manage it here.
  // For now, assuming it draws to the main WebGLContext canvas.
  // If Tt needs its own canvas (e.g. for specific sizing not fitting the global canvas),
  // it would be similar to TtA/TtF, creating its own Renderer.
  // However, the legacy .glF elements seemed to be individual canvases, implying they might
  // be better off managing their own render target if precise sizing relative to HTML is key.
  // For now, this version draws to the shared scene.

  return null; // This component draws to the shared WebGL canvas via context.scene
}

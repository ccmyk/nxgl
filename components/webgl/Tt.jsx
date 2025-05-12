// components/webgl/Tt.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Program, Mesh, Text as OGLText, Geometry, Vec2 } from 'ogl';
import gsap from 'gsap';
import SplitType from 'split-type'; 
import { useWebGL } from '@/contexts/WebGLContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/tt/msdf.frag.glsl';
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl';
import { lerp, clamp } from '@/lib/math';
import styles from './Tt.module.pcss';

export default function Tt({
  text = "DEFAULT TEXT",
  fontKey = 'default',
  interactionElementRef,
  ioRefSelf,
  isVisible = true,
  align = 'center',
  letterSpacing = -0.022,
  size = 5,
  width = undefined,
  color = [0, 0, 0],  // [R, G, B] 0-1
  animationParams = { durationIn: 0.8, durationPower: 2.0, delay: 0 },
  ioOptions = { threshold: 0.1 },
  className = '',
  glCanvasClassName = '',
}) {
  const { gl, scene, camera, isInitialized: isWebGLInitialized, assetsLoaded, fonts } = useWebGL();
  const meshRef = useRef(null);
  const textDataRef = useRef(null);
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const splitInstanceRef = useRef(null);
  const revealAnimationRef = useRef(null);
  const interactionTimelineInRef = useRef(null);
  const interactionTimelineOutRef = useRef(null);
  const charBoundsRef = useRef([]);

  const [interactionState, setInteractionState] = useState({
    targetCharIndex: -1,
    mouseXPercent: 0,
    charPowers: [],
    targetCharPowers: [],
    lerpFactor: 0.06,
  });

  // Select font data from context
  const fontData = fonts && fonts[fontKey] ? fonts[fontKey] : null;
  // Use intersection observer to trigger once element is in view
  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true);
  const combinedIsActive = isWebGLInitialized && assetsLoaded && fontData && isVisible && isInView;

  // 1. Initialize OGL Text mesh when WebGL ready and text visible
  useEffect(() => {
    if (!gl || !scene || !fontData?.json || !fontData?.texture || !isWebGLInitialized || !text) return;
    let mesh, program, geometry;
    try {
      const oglText = new OGLText({
        font: fontData.json,
        text,
        width,
        align,
        letterSpacing,
        size,
        lineHeight: 1,
      });
      textDataRef.current = oglText;
      geometry = new Geometry(gl, {
        position: { size: 3, data: oglText.buffers.position },
        uv: { size: 2, data: oglText.buffers.uv },
        id: { size: 1, data: oglText.buffers.id },
        index: { data: oglText.buffers.index },
      });
      geometry.computeBoundingBox();
      geometryRef.current = geometry;
      const charCount = oglText.meta.chars.length || 1;
      program = new Program(gl, {
        vertex: vertexShaderSource,
        fragment: fragmentShaderSource,
        uniforms: {
          tMap: { value: fontData.texture },
          uColor: { value: color },
          uAlpha: { value: 1.0 },
          uThreshold: { value: 0.05 },
          uMouse: { value: new Vec2(0, 0) },
          uPower: { value: 0.0 },
          uHoveredCharIndex: { value: -1.0 },
          uPowers: { value: new Float32Array(charCount).fill(0.0) },
          uRevealProgress: { value: 1.0 },
        },
        transparent: true,
        cullFace: null,
        depthWrite: false,
      });
      programRef.current = program;
      mesh = new Mesh(gl, { geometry, program });
      // Center the text mesh in its local space
      mesh.position.x = -oglText.width / 2;
      mesh.position.y = -oglText.height / 2 + oglText.height * 0.35;
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
      // Cleanup on unmount or dependency change
      revealAnimationRef.current?.kill();
      interactionTimelineInRef.current?.kill();
      interactionTimelineOutRef.current?.kill();
      scene?.removeChild(meshRef.current);
      programRef.current?.gl?.deleteProgram(programRef.current.program);
      geometryRef.current?.dispose();
      // console.log("Tt Cleanup:", text);
    };
  }, [gl, scene, isWebGLInitialized, assetsLoaded, fontData, text, width, align, letterSpacing, size, color]);

  // 2. Setup interaction element (split text for hover tracking, GSAP timelines for hover in/out)
  useEffect(() => {
    const interactionNode = interactionElementRef?.current;
    if (!interactionNode || !textDataRef.current || !programRef.current || !combinedIsActive) return;
    // GSAP timelines for overall power uniform
    interactionTimelineInRef.current = gsap.timeline({ paused: true })
      .to(programRef.current.uniforms.uPower, { value: 1.0, duration: 0.36, ease: 'power2.out' });
    interactionTimelineOutRef.current = gsap.timeline({ paused: true })
      .to(programRef.current.uniforms.uPower, { value: 0.0, duration: 0.6, ease: 'power2.inOut', onComplete: () => {
          if (programRef.current) {
            programRef.current.uniforms.uHoveredCharIndex.value = -1.0;
          }
      }});
    // Split text into spans for each character
    let splitInstance;
    try {
      splitInstanceRef.current?.revert();
      splitInstance = new SplitType(interactionNode, { types: 'chars', tagName: 'span' });
      splitInstanceRef.current = splitInstance;
      const parentRect = interactionNode.getBoundingClientRect();
      const bounds = (splitInstance.chars || []).map((el, idx) => {
        el.dataset.charIndex = idx;
        const rect = el.getBoundingClientRect();
        return {
          left: rect.left - parentRect.left,
          width: rect.width,
          index: idx,
        };
      });
      charBoundsRef.current = bounds;
    } catch (e) {
      console.error("SplitType error in Tt:", e);
      return;
    }
    // Helper to find which character index is hovered based on mouse X
    const findHoveredChar = (x) => {
      const relativeX = x - interactionNode.getBoundingClientRect().left;
      for (const bound of charBoundsRef.current) {
        if (relativeX >= bound.left && relativeX < bound.left + bound.width) return bound.index;
      }
      return -1;
    };
    // Mouse event handlers
    const handleMove = e => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const targetIndex = findHoveredChar(clientX);
      const rect = interactionNode.getBoundingClientRect();
      const relativeX = (clientX - rect.left) / rect.width;
      setInteractionState(prev => ({
        ...prev,
        targetCharIndex: targetIndex,
        mouseXPercent: clamp(relativeX - 0.5, -0.5, 0.5),
      }));
      if (programRef.current) {
        programRef.current.uniforms.uHoveredCharIndex.value = targetIndex !== -1 ? targetIndex : -1.0;
      }
    };
    const handleEnter = e => {
      setInteractionState(prev => ({ ...prev, lerpFactor: 0.08 }));
      interactionTimelineOutRef.current?.pause();
      interactionTimelineInRef.current?.restart();
      handleMove(e);
    };
    const handleLeave = () => {
      setInteractionState(prev => ({ ...prev, lerpFactor: 0.04, targetCharIndex: -1 }));
      interactionTimelineInRef.current?.pause();
      interactionTimelineOutRef.current?.restart();
    };
    interactionNode.addEventListener('mouseenter', handleEnter);
    interactionNode.addEventListener('mousemove', handleMove);
    interactionNode.addEventListener('mouseleave', handleLeave);
    // Touch events (optional)
    interactionNode.addEventListener('touchstart', handleEnter, { passive: true });
    interactionNode.addEventListener('touchmove', handleMove, { passive: true });
    interactionNode.addEventListener('touchend', handleLeave);
    return () => {
      interactionNode.removeEventListener('mouseenter', handleEnter);
      interactionNode.removeEventListener('mousemove', handleMove);
      interactionNode.removeEventListener('mouseleave', handleLeave);
      interactionNode.removeEventListener('touchstart', handleEnter);
      interactionNode.removeEventListener('touchmove', handleMove);
      interactionNode.removeEventListener('touchend', handleLeave);
      splitInstanceRef.current?.revert();
      interactionTimelineInRef.current?.kill();
      interactionTimelineOutRef.current?.kill();
    };
  }, [interactionElementRef, combinedIsActive]);

  // 3. Lerp update for character distortion powers each frame
  useEffect(() => {
    if (!programRef.current || !textDataRef.current || !combinedIsActive) return;
    const currentPowers = Array.from(interactionState.charPowers);
    const { targetCharIndex, lerpFactor } = interactionState;
    const charCount = textDataRef.current.meta.chars.length;
    if (currentPowers.length !== charCount) {
      // If length mismatch, reset arrays
      setInteractionState(prev => ({
        ...prev,
        charPowers: new Float32Array(charCount).fill(0.0),
        targetCharPowers: new Float32Array(charCount).fill(0.0),
      }));
      return;
    }
    let needsUpdate = false;
    // Calculate target distortion power for each character based on hovered index
    const newTargetPowers = new Float32Array(charCount);
    for (let i = 0; i < charCount; i++) {
      let targetPower = 0.0;
      if (targetCharIndex !== -1) {
        const dist = Math.abs(i - targetCharIndex);
        targetPower = Math.max(0, 1.0 - dist * 0.3);
      }
      newTargetPowers[i] = targetPower;
    }
    // Lerp current powers toward target powers
    const newPowers = new Float32Array(charCount);
    for (let i = 0; i < charCount; i++) {
      newPowers[i] = lerp(currentPowers[i], newTargetPowers[i], lerpFactor);
      if (Math.abs(newPowers[i] - currentPowers[i]) > 0.001) {
        needsUpdate = true;
      }
    }
    if (needsUpdate && programRef.current) {
      programRef.current.uniforms.uPowers.value = newPowers;
      setInteractionState(prev => ({ ...prev, charPowers: newPowers, targetCharPowers: newTargetPowers }));
    }
    // Update uniform for overall mouse X offset effect
    if (programRef.current) {
      programRef.current.uniforms.uMouse.value.x = interactionState.mouseXPercent;
    }
  }, [interactionState, combinedIsActive]);

  // 4. Reveal animation for text (fade in from invisible)
  useEffect(() => {
    if (!combinedIsActive || !programRef.current || revealAnimationRef.current?.isActive()) return;
    const { durationIn, delay: startDelay } = animationParams;
    const tl = gsap.timeline({ delay: startDelay });
    tl.fromTo(programRef.current.uniforms.uRevealProgress,
      { value: 1.0 },
      { value: 0.0, duration: durationIn, ease: 'power3.out' }
    );
    tl.fromTo(programRef.current.uniforms.uPower,
      { value: 0.0 },
      { value: 0.5, duration: animationParams.durationPower || 1.0, ease: 'power2.inOut' },
      0
    );
    revealAnimationRef.current = tl;
    tl.play();
    // After reveal, add 'act' class to interaction element to indicate activation
    if (interactionElementRef?.current) {
      gsap.delayedCall(startDelay + durationIn, () => {
        interactionElementRef.current.classList.add('act');
      });
    }
  }, [combinedIsActive, animationParams, interactionElementRef]);

  // This component renders nothing to the DOM by itself (WebGL canvas draws the text)
  return null;
}
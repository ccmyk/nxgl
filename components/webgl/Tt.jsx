// components/webgl/Tt.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useWebGL } from '@/contexts/WebGLContext';
import { Program, Mesh, Text as OGLText, Texture, Geometry, Vec2 } from 'ogl';
import gsap from 'gsap';
import SplitType from 'split-type';
import styles from './Tt.module.pcss';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/tt/msdf.frag.glsl';
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl';

// Helper function - place in utils/math.js later
function lerp(p1, p2, t) { return p1 + (p2 - p1) * t; }

export default function Tt({
  text = "DEFAULT TEXT",
  fontJson, // MSDF Font JSON data (Required Prop)
  fontTexture, // OGL Texture instance of the font atlas (Required Prop)
  isVisible = true, // External visibility control (e.g., page loaded)
  interactionElementRef, // Ref to the HTML element for mouse interaction (.Oiel) (Required Prop)
  ioRefSelf, // Ref attached to the element triggering the IO (can be interactionElementRef.current?.parentNode)
  align = 'center',
  letterSpacing = -0.022, // Default from example usage
  size = 5, // Default from example usage
  width = undefined,
  color = 0.0,
  // Animation parameters derived from 💬/position.js start() -> animstart timeline
  animationParams = { durationIn: 0.8, durationPower: 2.0 },
}) {

  const { gl, scene, camera, isInitialized: isWebGLInitialized, size: webglSize } = useWebGL();
  const meshRef = useRef(null);
  const textDataRef = useRef(null); // Ref for OGL Text data object
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const splitInstanceRef = useRef(null);
  const animationTimelineRef = useRef(null); // Ref for GSAP reveal animation
  const interactionTimelineInRef = useRef(null); // Ref for GSAP mouse IN animation
  const interactionTimelineOutRef = useRef(null); // Ref for GSAP mouse OUT animation

  const [interactionData, setInteractionData] = useState({
    targetIndex: -1, mouseX: 0, powers: [], needsUpdate: false, lerpFactor: 0.6 // Store lerp factor from base.js
  });

  // Use IO hook on the passed ioRefSelf
  const [isInView] = useIntersectionObserver(ioRefSelf, { threshold: 0.1 }, true); // Freeze once visible
  const combinedIsActive = isWebGLInitialized && isVisible && isInView;

  // --- Setup OGL Text Object and Mesh ---
  useEffect(() => {
    if (!gl || !fontJson || !fontTexture || !isWebGLInitialized || !text) return;

    let mesh;
    let program;
    let geometry;

    try {
      // --- Setup from 💬/base.js constructor ---
      const oglText = new OGLText({ font: fontJson, text, width, align, letterSpacing, size, lineHeight: 1 });
      textDataRef.current = oglText; // Store text data

      geometry = new Geometry(gl, {
        position: { size: 3, data: oglText.buffers.position },
        uv: { size: 2, data: oglText.buffers.uv },
        id: { size: 1, data: oglText.buffers.id },
        index: { data: oglText.buffers.index },
      });
      geometry.computeBoundingBox();
      geometryRef.current = geometry;

      const charCount = oglText.meta.chars.length || 1; // Prevent division by zero if text is empty
      const processedFragmentSource = fragmentShaderSource.replace(/PITO/g, charCount.toString());

      program = new Program(gl, {
        vertex: vertexShaderSource,
        fragment: processedFragmentSource,
        uniforms: {
          uTime: { value: 0 },
          uScreen: { value: [webglSize.width, webglSize.height] },
          uMouse: { value: new Vec2(0, 0) },
          uPower: { value: 0.5 }, // Start value from animstart
          uCols: { value: 1.5 },
          uColor: { value: color },
          uStart: { value: 1 }, // Start value from animstart
          uKey: { value: -1 },
          uPowers: { value: new Float32Array(charCount).fill(0.5) },
          tMap: { value: fontTexture },
        },
        transparent: true, cullFace: null, depthWrite: false,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      mesh.position.x = oglText.width * -0.5;
      mesh.position.y = oglText.height * 0.58; // From base.js
      meshRef.current = mesh;

      // Initialize interaction state based on text length
      setInteractionData(prev => ({
        ...prev,
        powers: new Float32Array(charCount).fill(0.5),
      }));

      console.log('Tt Initialized:', text);

    } catch (error) { console.error("Error initializing Tt:", text, error); }

    // Cleanup
    return () => {
      scene?.removeChild(mesh);
      program?.gl?.deleteProgram(program.program);
      geometry?.dispose();
      console.log("Tt Cleanup:", text);
    };
  // Re-run if essential props like text content or font data change
  }, [gl, scene, isWebGLInitialized, fontJson, fontTexture, text, width, align, letterSpacing, size, color, webglSize.width, webglSize.height]);

  // --- Setup Interaction Element & GSAP interaction timelines ---
  useEffect(() => {
    const interactionNode = interactionElementRef?.current;
    if (!interactionNode || !textDataRef.current) return; // Need OGL Text for char count

     // --- Setup GSAP interaction timelines from base.js initEvents ---
     interactionTimelineInRef.current = gsap.timeline({ paused: true })
         .to(programRef.current.uniforms.uPower, { value: 1, duration: 0.36, ease: 'power4.inOut' }, 0);

     interactionTimelineOutRef.current = gsap.timeline({ paused: true })
         .to(programRef.current.uniforms.uPower, { value: 0, duration: 0.6, ease: 'none',
             onComplete: () => { if(programRef.current) programRef.current.uniforms.uKey.value = -1; }
          }, 0);

    // --- SplitType & Event Listeners from base.js initEvents ---
    let splitInstance;
    let charBounds = [];
    try {
      splitInstance = new SplitType(interactionNode, { types: 'chars,words', tagName: 'span' });
      splitInstanceRef.current = splitInstance;
      // Add index and calculate bounds
      (splitInstance.chars || []).forEach((el, idx) => {
          el.dataset.charIndex = idx; // Ensure index is stored
          const rect = el.getBoundingClientRect();
          // Store bounds relative to the interactionNode's origin
          const parentRect = interactionNode.getBoundingClientRect();
          charBounds.push({ left: rect.left - parentRect.left, width: rect.width, index: idx });
      });
    } catch (e) { console.error("SplitType error on interaction element:", e); return; }

    const findHoveredChar = (mouseX) => {
      const relativeX = mouseX - interactionNode.getBoundingClientRect().left;
      for (const bound of charBounds) {
        if (relativeX >= bound.left && relativeX <= bound.left + bound.width) {
          return bound.index;
        }
      } return -1;
    };

    const handleInteractionMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const targetIndex = findHoveredChar(clientX);
      const relativeX = (clientX - interactionNode.getBoundingClientRect().left) / interactionNode.clientWidth;
      setInteractionData(prev => ({ ...prev, targetIndex, mouseX: clamp(-0.5, 0.5, relativeX - 0.5), needsUpdate: true })); // Center mouseX around 0
    };

    const handleInteractionEnter = (e) => {
        setInteractionData(prev => ({ ...prev, lerpFactor: 0.06 })); // Faster lerp on enter - from base.js
        interactionTimelineOutRef.current?.pause();
        interactionTimelineInRef.current?.play();
        // Initial calculation on enter
        handleInteractionMove(e);
    };

     const handleInteractionLeave = (e) => {
        setInteractionData(prev => ({ ...prev, lerpFactor: 0.03 })); // Slower lerp on leave - from base.js
        interactionTimelineInRef.current?.pause();
        interactionTimelineOutRef.current?.play(); // Play fade out power animation
        // Set targetIndex to -1 immediately to start lerping powers back
         setInteractionData(prev => ({ ...prev, targetIndex: -1, needsUpdate: true }));
    };

    // Attach listeners derived from base.js initEvents
    interactionNode.addEventListener('mouseenter', handleInteractionEnter);
    interactionNode.addEventListener('mousemove', handleInteractionMove);
    interactionNode.addEventListener('mouseleave', handleInteractionLeave);
    interactionNode.addEventListener('touchstart', handleInteractionEnter, { passive: true });
    interactionNode.addEventListener('touchmove', handleInteractionMove, { passive: true });
    interactionNode.addEventListener('touchend', handleInteractionLeave);

    return () => { // Cleanup listeners and SplitType
      interactionNode.removeEventListener('mouseenter', handleInteractionEnter);
      interactionNode.removeEventListener('mousemove', handleInteractionMove);
      interactionNode.removeEventListener('mouseleave', handleInteractionLeave);
      interactionNode.removeEventListener('touchstart', handleInteractionEnter);
      interactionNode.removeEventListener('touchmove', handleInteractionMove);
      interactionNode.removeEventListener('touchend', handleInteractionLeave);
      splitInstanceRef.current?.revert();
      interactionTimelineInRef.current?.kill();
      interactionTimelineOutRef.current?.kill();
    };
  }, [interactionElementRef, textDataRef]); // Rerun if interaction element changes


  // --- Effect to Lerp and Update uPowers Uniform ---
  useEffect(() => {
    if (!programRef.current || !textDataRef.current) return; // Ensure program and text data are ready

    const currentPowers = programRef.current.uniforms.uPowers.value;
    if(interactionData.powers.length !== currentPowers.length) return; // Mismatch guard

    let needsUpdate = false;
    const newPowers = new Float32Array(currentPowers.length);
    const hoverIndex = interactionData.targetIndex;
    const lerpFactor = interactionData.lerpFactor;

    // Calculate target powers based on hoverIndex (from base.js calcChars)
    for (let i = 0; i < currentPowers.length; i++) {
        let targetPower = 0.5; // Default non-hovered state
        if (hoverIndex !== -1) {
             const distFactor = Math.abs(i - hoverIndex);
             targetPower = Math.max(0, 1.0 - distFactor * 0.2); // Proximity effect
        }
        newPowers[i] = lerp(currentPowers[i], targetPower, lerpFactor);
        // Check if value actually changed significantly
        if (Math.abs(newPowers[i] - currentPowers[i]) > 0.001) {
            needsUpdate = true;
        }
    }

    // Only update uniforms if values changed
    if (needsUpdate) {
        programRef.current.uniforms.uPowers.value = newPowers;
    }
     // Update key and mouse regardless of power change, driven by state
    programRef.current.uniforms.uKey.value = interactionData.targetIndex;
    programRef.current.uniforms.uMouse.value.x = interactionData.mouseX;

  // This effect doesn't need requestAnimationFrame because the main
  // render loop (external or internal via useFrame) will pick up the uniform changes.
  // We run it whenever interactionData changes.
  }, [interactionData]);


  // --- Reveal Animation Trigger ---
  useEffect(() => {
    if (!combinedIsActive || !programRef.current || animationTimelineRef.current?.isActive()) return;

    // GSAP timeline based on 💬/position.js start() -> animstart
    const { durationIn, durationPower } = animationParams;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(programRef.current.uniforms.uStart, { value: 1 }, { value: 0, duration: durationIn, ease: 'power4.inOut' }, 0)
      .fromTo(programRef.current.uniforms.uPower, { value: 0.5 }, { value: 0, duration: durationPower, ease: 'power2.inOut' }, 0)
      .set(programRef.current.uniforms.uKey, { value: -1 }, '>');

    animationTimelineRef.current = tl;
    tl.play();

  }, [combinedIsActive, programRef, animationParams]); // Trigger on combined active state


  // Update resolution uniform on resize
  useEffect(() => {
    if (programRef.current && webglSize.width && webglSize.height) {
        programRef.current.uniforms.uScreen.value = [webglSize.width, webglSize.height];
        // Original also updated camera perspective & viewport calculation here,
        // but that's now handled globally by WebGLProvider reacting to useViewport
    }
  }, [webglSize]);


  // This component adds its mesh to the shared scene, doesn't render directly
  return null;
}
// components/webgl/Tt.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Program, Mesh, Text as OGLText, Texture, Geometry, Vec2 } from 'ogl';
import gsap from 'gsap';
import SplitType from 'split-type';
import { useWebGL } from '@/contexts/WebGLContext';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/tt/msdf.frag.glsl'; // Base MSDF frag
import vertexShaderSource from '@/shaders/tt/msdf.vert.glsl'; // Base MSDF vert
import { lerp } from '@/lib/math'; // Import lerp

export default function Tt({
  text = "DEFAULT TEXT",
  fontJson, // REQUIRED: MSDF Font JSON data
  fontTexture, // REQUIRED: OGL Texture instance of the font atlas
  interactionElementRef, // REQUIRED: Ref to the HTML element for mouse interaction (.Oiel)
  ioRefSelf, // REQUIRED: Ref to the element triggering the IO (e.g., parent container)
  isVisible = true, // Optional: External visibility control
  align = 'center',
  letterSpacing = -0.022,
  size = 5,
  width = undefined,
  color = 0.0, // 0.0 for black, 1.0 for white (based on legacy)
  // Animation parameters derived from 💬/position.js start() -> animstart timeline
  animationParams = { durationIn: 0.8, durationPower: 2.0 },
  ioOptions = { threshold: 0.1 }, // Default IO options
  className = '', // Allow passing additional classes
}) {
  const { gl, scene, camera, isInitialized: isWebGLInitialized, size: webglSize } = useWebGL();
  const meshRef = useRef(null);
  const textDataRef = useRef(null);
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const splitInstanceRef = useRef(null);
  const animationTimelineRef = useRef(null);
  const interactionTimelineInRef = useRef(null);
  const interactionTimelineOutRef = useRef(null);
  const charBoundsRef = useRef([]); // Store character bounds for interaction

  // Interaction state using useState for reactivity
  const [interactionData, setInteractionData] = useState({
    targetIndex: -1, // Currently hovered character index (-1 if none)
    mouseX: 0, // Mouse position relative to the element width (-0.5 to 0.5)
    powers: [], // Per-character distortion power (lerped value)
    targetPowers: [], // Target power based on hover
    lerpFactor: 0.06, // Lerp speed (from legacy base.js)
  });

  // Use IO hook on the passed ioRefSelf, freeze once visible
  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true);
  const combinedIsActive = isWebGLInitialized && isVisible && isInView;

  // --- Setup OGL Text Object and Mesh ---
  useEffect(() => {
    if (!gl || !scene || !fontJson || !fontTexture || !isWebGLInitialized || !text) return;

    let mesh, program, geometry;

    try {
      const oglText = new OGLText({ font: fontJson, text, width, align, letterSpacing, size, lineHeight: 1 });
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
      const processedFragmentSource = fragmentShaderSource.replace(/PITO/g, charCount.toString());

      program = new Program(gl, {
        vertex: vertexShaderSource, // Use standard MSDF vertex shader
        fragment: processedFragmentSource,
        uniforms: {
          uTime: { value: 0 },
          // uScreen: { value: [webglSize.width, webglSize.height] }, // Not used in base MSDF shader
          uMouse: { value: new Vec2(0, 0) }, // Used for interaction offset
          uPower: { value: 0.5 }, // Overall interaction power (animated in/out)
          uCols: { value: 1.5 }, // From legacy shader
          uColor: { value: color }, // Text color (0=black, 1=white)
          uStart: { value: 1 }, // Reveal animation progress
          uKey: { value: -1 }, // Hovered character index
          // Initialize uPowers with default state (0.5 means no distortion)
          uPowers: { value: new Float32Array(charCount).fill(0.5) },
          tMap: { value: fontTexture },
        },
        transparent: true, cullFace: null, depthWrite: false,
      });
      programRef.current = program;

      mesh = new Mesh(gl, { geometry, program });
      mesh.setParent(scene);
      // Center the text mesh (from legacy base.js)
      mesh.position.x = oglText.width * -0.5;
      mesh.position.y = oglText.height * 0.58;
      meshRef.current = mesh;

      // Initialize interaction state arrays based on actual char count
      setInteractionData(prev => ({
        ...prev,
        powers: new Float32Array(charCount).fill(0.5),
        targetPowers: new Float32Array(charCount).fill(0.5),
      }));

      console.log('Tt Initialized:', text);

    } catch (error) { console.error("Error initializing Tt:", text, error); }

    // Cleanup
    return () => {
      scene?.removeChild(mesh);
      program?.gl?.deleteProgram(program.program);
      geometry?.dispose();
      interactionTimelineInRef.current?.kill();
      interactionTimelineOutRef.current?.kill();
      animationTimelineRef.current?.kill();
      console.log("Tt Cleanup:", text);
    };
  // Ensure effect re-runs if critical props change
  }, [gl, scene, isWebGLInitialized, fontJson, fontTexture, text, width, align, letterSpacing, size, color]);

  // --- Setup Interaction Element & GSAP interaction timelines ---
  useEffect(() => {
    const interactionNode = interactionElementRef?.current;
    if (!interactionNode || !textDataRef.current || !programRef.current) return;

    // --- GSAP Timelines for mouse interaction power (uPower) ---
    interactionTimelineInRef.current = gsap.timeline({ paused: true })
      .to(programRef.current.uniforms.uPower, { value: 1, duration: 0.36, ease: 'power4.inOut' }, 0);

    interactionTimelineOutRef.current = gsap.timeline({ paused: true })
      .to(programRef.current.uniforms.uPower, { value: 0, duration: 0.6, ease: 'none',
          onComplete: () => { if(programRef.current) programRef.current.uniforms.uKey.value = -1; } // Reset key on out complete
       }, 0);

    // --- SplitType & Event Listeners ---
    let splitInstance;
    const bounds = []; // Local variable for bounds calculation
    try {
      splitInstanceRef.current?.revert(); // Revert previous if any
      splitInstance = new SplitType(interactionNode, { types: 'chars,words', tagName: 'span' });
      splitInstanceRef.current = splitInstance;

      const parentRect = interactionNode.getBoundingClientRect();
      (splitInstance.chars || []).forEach((el, idx) => {
        el.dataset.charIndex = idx;
        const rect = el.getBoundingClientRect();
        bounds.push({ left: rect.left - parentRect.left, width: rect.width, index: idx });
      });
      charBoundsRef.current = bounds; // Store calculated bounds in ref

    } catch (e) { console.error("SplitType Error on interaction element:", e, interactionNode); return; }

    const findHoveredChar = (mouseX) => {
      const relativeX = mouseX - interactionNode.getBoundingClientRect().left;
      for (const bound of charBoundsRef.current) { // Use ref here
        if (relativeX >= bound.left && relativeX <= bound.left + bound.width) {
          return bound.index;
        }
      } return -1;
    };

    const handleInteractionMove = (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const targetIndex = findHoveredChar(clientX);
      const relativeX = (clientX - interactionNode.getBoundingClientRect().left) / interactionNode.clientWidth;
      // Update state: target index, mouse position (-0.5 to 0.5), and flag for update
      setInteractionData(prev => ({
          ...prev,
          targetIndex,
          mouseX: clamp(-0.5, 0.5, relativeX - 0.5),
      }));
    };

    const handleInteractionEnter = (e) => {
      setInteractionData(prev => ({ ...prev, lerpFactor: 0.06 })); // Faster lerp
      interactionTimelineOutRef.current?.pause();
      interactionTimelineInRef.current?.play();
      handleInteractionMove(e); // Initial calculation
    };

    const handleInteractionLeave = (e) => {
      setInteractionData(prev => ({ ...prev, lerpFactor: 0.03, targetIndex: -1 })); // Slower lerp, reset target
      interactionTimelineInRef.current?.pause();
      interactionTimelineOutRef.current?.play(); // Play fade out power animation
    };

    // Attach listeners
    interactionNode.addEventListener('mouseenter', handleInteractionEnter);
    interactionNode.addEventListener('mousemove', handleInteractionMove);
    interactionNode.addEventListener('mouseleave', handleInteractionLeave);
    interactionNode.addEventListener('touchstart', handleInteractionEnter, { passive: true });
    interactionNode.addEventListener('touchmove', handleInteractionMove, { passive: true });
    interactionNode.addEventListener('touchend', handleInteractionLeave);

    return () => { // Cleanup
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
  }, [interactionElementRef, textDataRef, programRef]); // Rerun if interaction element or program changes

  // --- Effect to Lerp and Update uPowers Uniform ---
  useEffect(() => {
    if (!programRef.current || !textDataRef.current) return;

    const currentPowers = interactionData.powers;
    const targetPowers = interactionData.targetPowers;
    const hoverIndex = interactionData.targetIndex;
    const lerpFactor = interactionData.lerpFactor;
    const charCount = textDataRef.current.meta.chars.length;

    // Ensure arrays are initialized and have the correct length
    if (currentPowers.length !== charCount || targetPowers.length !== charCount) {
       setInteractionData(prev => ({
           ...prev,
           powers: new Float32Array(charCount).fill(0.5),
           targetPowers: new Float32Array(charCount).fill(0.5),
       }));
       return; // Skip update this cycle, will run again after state update
    }

    let needsUniformUpdate = false;

    // Calculate target powers based on hoverIndex (logic from base.js calcChars)
    for (let i = 0; i < charCount; i++) {
      let targetPower = 0.5; // Default non-hovered state
      if (hoverIndex !== -1) {
        const distFactor = Math.abs(i - hoverIndex);
        // Simple proximity effect: 1 at hover, decreasing linearly
        targetPower = Math.max(0, 1.0 - distFactor * 0.2); // Adjust multiplier (0.2) for spread
      }
      targetPowers[i] = targetPower; // Update target array
    }

    // Lerp current powers towards target powers
    const newPowers = new Float32Array(charCount);
    for (let i = 0; i < charCount; i++) {
      newPowers[i] = lerp(currentPowers[i], targetPowers[i], lerpFactor);
      // Check if value actually changed significantly to warrant uniform update
      if (Math.abs(newPowers[i] - currentPowers[i]) > 0.001) {
        needsUniformUpdate = true;
      }
    }

    // Update uniforms and state only if values changed
    if (needsUniformUpdate) {
      programRef.current.uniforms.uPowers.value = newPowers;
      // Update state to store the new lerped values for the next frame
      setInteractionData(prev => ({ ...prev, powers: newPowers }));
    }
     // Update key and mouse uniforms directly from state
    programRef.current.uniforms.uKey.value = interactionData.targetIndex;
    programRef.current.uniforms.uMouse.value.x = interactionData.mouseX;

  }, [interactionData]); // Run whenever interactionData changes

  // --- Reveal Animation Trigger ---
  useEffect(() => {
    if (!combinedIsActive || !programRef.current || animationTimelineRef.current?.isActive()) return;

    // GSAP timeline based on 💬/position.js start() -> animstart
    const { durationIn, durationPower } = animationParams;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(programRef.current.uniforms.uStart, { value: 1 }, { value: 0, duration: durationIn, ease: 'power4.inOut' }, 0)
      .fromTo(programRef.current.uniforms.uPower, { value: 0.5 }, { value: 0, duration: durationPower, ease: 'power2.inOut' }, 0)
      .set(programRef.current.uniforms.uKey, { value: -1 }, '>'); // Reset key after reveal

    animationTimelineRef.current = tl;
    tl.play();

    // Add 'act' class to interaction element after animation (like legacy)
    gsap.delayedCall(durationIn + durationPower, () => { // Adjust delay if needed
        interactionElementRef?.current?.classList.add('act');
    });


  }, [combinedIsActive, programRef, animationParams, interactionElementRef]);

  // Update resolution uniform on resize (handled by WebGLContext)
  // useEffect(() => {
  //   if (programRef.current && webglSize.width && webglSize.height) {
  //       programRef.current.uniforms.uScreen.value = [webglSize.width, webglSize.height];
  //   }
  // }, [webglSize]);

  // This component renders its mesh into the shared scene via the context
  return null;
}

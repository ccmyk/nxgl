// components/webgl/TtA.jsx
'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useWebGL } from '@/contexts/WebGLContext';
import { Program, Mesh, Text as OGLText, Texture, Geometry, Vec2 } from 'ogl';
import gsap from 'gsap';
import SplitType from 'split-type';
import styles from './TtA.module.pcss';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import fragmentShaderSource from '@/shaders/tta/msdf.frag.glsl';
import parentFragmentShaderSource from '@/shaders/tta/parent.frag.glsl';

export default function TtA({
  text,
  fontJson,
  fontTexture,
  isVisible = true,
  interactionElementRef,
  ioRefSelf,
  align = 'center',
  letterSpacing = -0.022,
  size = 5,
  width = undefined,
  color = 0.0,
  animationParams = { durationIn: 0.8, durationPower: 2.0 },
}) {
  const { gl, scene, camera, isInitialized, size: webglSize } = useWebGL();
  const meshRef = useRef(null);
  const programRef = useRef(null);
  const geometryRef = useRef(null);
  const textDataRef = useRef(null);
  const splitInstanceRef = useRef(null);
  const animationTimelineRef = useRef(null);

  const [isInView] = useIntersectionObserver(ioRefSelf, { threshold: 0.1 }, true);
  const combinedIsActive = isInitialized && isVisible && isInView;

  useEffect(() => {
    if (!gl || !fontJson || !fontTexture || !isInitialized || !text) return;

    let mesh, program, geometry;

    const oglText = new OGLText({ font: fontJson, text, width, align, letterSpacing, size, lineHeight: 1 });
    textDataRef.current = oglText;

    geometry = new Geometry(gl, {
      position: { size: 3, data: oglText.buffers.position },
      uv: { size: 2, data: oglText.buffers.uv },
      id: { size: 1, data: oglText.buffers.id },
      index: { data: oglText.buffers.index },
    });
    geometryRef.current = geometry;

    const charCount = oglText.meta.chars.length || 1;
    const processedFragmentSource = fragmentShaderSource.replace(/PITO/g, charCount.toString());

    program = new Program(gl, {
      vertex: vertexShaderSource,
      fragment: processedFragmentSource,
      uniforms: {
        uTime: { value: 0 },
        uScreen: { value: [webglSize.width, webglSize.height] },
        uMouse: { value: new Vec2(0, 0) },
        uPower: { value: 0.5 },
        uCols: { value: 1.5 },
        uColor: { value: color },
        uStart: { value: 1 },
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
    mesh.position.y = oglText.height * 0.58;
    meshRef.current = mesh;

    return () => {
      scene?.removeChild(mesh);
      program?.gl?.deleteProgram(program.program);
      geometry?.dispose();
    };
  }, [gl, scene, isInitialized, fontJson, fontTexture, text, width, align, letterSpacing, size, color, webglSize.width, webglSize.height]);

  useEffect(() => {
    if (programRef.current && webglSize.width && webglSize.height) {
      programRef.current.uniforms.uScreen.value = [webglSize.width, webglSize.height];
    }
  }, [webglSize]);

  useEffect(() => {
    if (!combinedIsActive || !programRef.current || animationTimelineRef.current?.isActive()) return;
    const { durationIn, durationPower } = animationParams;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(programRef.current.uniforms.uStart, { value: 1 }, { value: 0, duration: durationIn, ease: 'power4.inOut' }, 0)
      .fromTo(programRef.current.uniforms.uPower, { value: 0.5 }, { value: 0, duration: durationPower, ease: 'power2.inOut' }, 0)
      .set(programRef.current.uniforms.uKey, { value: -1 }, '>');
    animationTimelineRef.current = tl;
    tl.play();
  }, [combinedIsActive]);

  return null;
}

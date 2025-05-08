// components/webgl/Sl.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback, forwardRef } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Texture, Plane, Vec2, Post } from 'ogl';
import gsap from 'gsap';
import styles from './Sl.module.pcss'; // Ensure this path is correct
import { useWebGL } from '@/contexts/WebGLContext'; // Assuming shared context for camera
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useLenis } from '@/hooks/useLenis'; // Assuming Lenis context provider exists
import fragmentShader from '@/shaders/sl/main.frag.glsl';
import vertexShader from '@/shaders/sl/main.vert.glsl';
import parentFragmentShaderSource from '@/shaders/sl/parent.frag.glsl';
import { clamp, lerp } from '@/lib/math'; // Assuming math utils exist

// Component definition using forwardRef
const Sl = forwardRef(({
  mediaSources = [], // Array of { src: string, type: 'image' | 'video' }
  mediaElementRefs = [], // Array of refs to corresponding <img/> or <video/> elements
  isVisible = true,
  ioRefSelf, // Ref for IO trigger
  ioOptions = { threshold: 0.1 },
  touch = false,
  className = '',
}, ref) => { // Added ref parameter here

  // Hooks and Refs initialization
  const { gl: contextGl, camera: contextCamera, isInitialized, size: webglSize } = useWebGL(); // Use global camera
  const canvasRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const postRef = useRef(null);
  const meshesRef = useRef([]);
  const texturesRef = useRef([]);
  const rafIdRef = useRef(null);
  const isMountedRef = useRef(false);

  const [isActive, setIsActive] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const scrollControlRef = useRef({
    current: 0, target: 0, limit: 1, start: 0, prog: 0, lerp: 0.075,
    stop: 0, timeline: null,
  });
  const hoverControlRef = useRef({ value: 0, target: 0, lerp: 0.05 });

  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions, true);

  const { lenis } = useLenis();
  const currentScrollY = useRef(0);
  useEffect(() => {
    const lenisInstance = lenis?.current;
    if (!lenisInstance) return;
    const unsubscribe = lenisInstance.on('scroll', ({ scroll }) => {
      currentScrollY.current = scroll;
    });
    return unsubscribe;
  }, [lenis]);

  // --- Initialization ---
  useEffect(() => {
    // Guard clauses
    if (!canvasRef.current || !isInitialized || mediaSources.length === 0 || !contextCamera) {
        console.warn("Sl: Initialization prerequisites not met.", {isInitialized, canvas: !!canvasRef.current, sources: mediaSources.length, camera: !!contextCamera});
        return;
    }
    isMountedRef.current = true;

    let renderer, scene, post, geometry;
    const meshes = [];
    const textures = [];
    let tl; // GSAP timeline

    try {
      // --- OGL Setup ---
      renderer = new Renderer({ canvas: canvasRef.current, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
      const gl = renderer.gl;
      rendererRef.current = renderer;
      scene = new Transform();
      sceneRef.current = scene;

      geometry = new Plane(gl); // Shared geometry

      // --- Create Meshes and Textures ---
      mediaSources.forEach((media, index) => {
        const texture = new Texture(gl, { generateMipmaps: false });
        textures.push(texture);
        texturesRef.current.push(texture); // Store in ref as well

        const program = new Program(gl, {
          vertex: vertexShader,
          fragment: fragmentShader,
          uniforms: {
            tMap: { value: texture },
            // Add other base uniforms if your base shaders require them
          },
          transparent: true,
        });

        const mesh = new Mesh(gl, { geometry, program });
        mesh.setParent(scene);
        meshes.push(mesh);
        // Store mesh in ref array *after* creation
        // meshesRef.current[index] = mesh; // Assign directly if pre-sized, otherwise push

        // --- Load Media ---
        const mediaElement = mediaElementRefs[index]?.current;
        const isVideo = media.type === 'video';
        // Use the passed ref if available, otherwise create element in memory
        const element = mediaElement || (isVideo ? document.createElement('video') : new Image());

        const updateTextureAndSize = (loadedMedia) => {
           texture.image = loadedMedia;
           // Optional: Update uniforms related to texture size if shaders need it
           // program.uniforms.uTextureSize.value = [naturalWidth, naturalHeight];
           handleResize(); // Trigger resize to position correctly after load
        };

        if (isVideo) {
            element.muted = true; element.loop = true; element.playsInline = true;
            element.autoplay = false; element.preload = 'metadata';
            // Use 'loadedmetadata' for videos
            element.onloadedmetadata = () => updateTextureAndSize(element);
            // Check if src is already set (if using passed ref)
            if (!element.src) element.src = media.src;
            element.load();
        } else {
            element.onload = () => updateTextureAndSize(element);
            element.onerror = () => console.error("Sl: Failed to load image:", media.src);
            // Check if src is already set
            if (!element.src) element.src = media.src;
        }
      });
      // Assign meshes to ref after loop
      meshesRef.current = meshes;


      // --- Post Processing Setup ---
      post = new Post(gl);
      post.addPass({
        fragment: parentFragmentShaderSource,
        uniforms: {
          uTime: { value: 0 },
          uStart: { value: 0 }, // Scroll controlled
          uHover: { value: 0 }, // Hover controlled
        },
      });
      postRef.current = post;

      // --- GSAP Timeline for Scroll ---
      tl = gsap.timeline({ paused: true })
          .fromTo(post.passes[0].uniforms.uStart,
              { value: 0 },
              { value: 1, ease: 'none' } // Linear mapping to scroll progress
          );
      scrollControlRef.current.timeline = tl;

      console.log('Sl Initialized');

    } catch (e) { console.error("Error initializing Sl:", e); }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      scrollControlRef.current.timeline?.kill();
      meshesRef.current.forEach(m => scene?.removeChild(m)); // Use optional chaining
      meshesRef.current = [];
      texturesRef.current.forEach(t => t?.dispose());
      texturesRef.current = [];
      geometry?.dispose();
      // Programs are implicitly deleted when context is lost or via renderer.dispose
      postRef.current = null;
      renderer?.dispose();
      console.log("Sl Cleanup");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, mediaSources, mediaElementRefs, contextCamera]); // Add contextCamera dependency

  // --- Resize Handler ---
  const handleResize = useCallback(() => {
    const renderer = rendererRef.current;
    const camera = contextCamera; // Use global camera
    const canvas = canvasRef.current;
    const parentContainer = canvas?.parentNode; // Get parent for sizing
    if (!renderer || !camera || !parentContainer || meshesRef.current.length === 0) return;

    const width = parentContainer.offsetWidth;
    const height = parentContainer.offsetHeight;

    // Check for zero dimensions
    if (width === 0 || height === 0) {
        console.warn("Sl: Resize called with zero dimensions for parent.");
        return;
    }


    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    renderer.setSize(width, height);

    camera.perspective({ aspect: width / height });

    // Calculate viewport units
    const fov = camera.fov * (Math.PI / 180);
    // Ensure camera.position.z is not zero
    const camZ = camera.position.z === 0 ? 0.001 : camera.position.z;
    const viewportHeight = 2 * Math.tan(fov / 2) * camZ;
    const viewportWidth = viewportHeight * camera.aspect;

    // Position and scale meshes (example: simple horizontal layout)
    const meshWidth = viewportWidth / meshesRef.current.length;
    meshesRef.current.forEach((meshData, i) => { // Assuming meshesRef holds objects { mesh: Mesh, ... }
        if (!meshData || !meshData.mesh) return; // Guard against undefined mesh
        const mesh = meshData.mesh;
        mesh.scale.x = meshWidth * 0.9; // Example scaling
        mesh.scale.y = viewportHeight * 0.9;
        mesh.position.x = (i - (meshesRef.current.length - 1) / 2) * meshWidth;
        mesh.position.y = 0;
    });

    // Recalculate scroll trigger points
    const triggerElement = ioRefSelf?.current; // Use the IO trigger element
    if (triggerElement) {
        const bound = triggerElement.getBoundingClientRect();
        const screenH = window.innerHeight;
        const elementH = bound.height;
        let calc = 0;
        let fix = touch ? 0 : screenH * 0.1;
        scrollControlRef.current.start = parseInt(bound.top - screenH + window.scrollY + fix);
        scrollControlRef.current.limit = parseInt(elementH + calc + fix);
    }

  }, [contextCamera, ioRefSelf, touch]); // Dependencies

  useEffect(() => {
    // Debounce resize or use ResizeObserver for better performance if needed
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // --- IO and Active State ---
  useEffect(() => {
    if (isInView && !isActive) {
      setIsActive(true);
      setIsExiting(false);
      // Play videos only when active
      meshesRef.current.forEach(m => {
          const tex = m.texture; // Access texture from meshData object
          if (tex?.image?.tagName === 'VIDEO') tex.image.play().catch(e => console.warn("Sl: Vid play fail", e));
      });
      console.log('Sl activated');
    } else if (!isInView && isActive) {
      setIsActive(false);
      setIsExiting(true); // Trigger exit visual state
      // Pause videos when inactive
      meshesRef.current.forEach(m => {
          const tex = m.texture;
          if (tex?.image?.tagName === 'VIDEO') tex.image.pause();
      });
       // Optionally reset scroll progress on exit?
       // scrollControlRef.current.timeline?.progress(0);
      console.log('Sl deactivated');
    }
  }, [isInView, isActive]);

  // --- Render Loop ---
  useEffect(() => {
    if (!isMountedRef.current) return;

    const renderLoop = (time) => {
      rafIdRef.current = requestAnimationFrame(renderLoop);
      // Added checks for refs that might be cleaned up
      if (!isActive || !rendererRef.current || !sceneRef.current || !contextCamera || !postRef.current || !isMountedRef.current) {
          return;
      }

      // Update scroll animation
      if (scrollControlRef.current.stop !== 1) {
        const y = currentScrollY.current;
        const { start, limit, lerp: scrollLerp, timeline } = scrollControlRef.current;
        const currentRelative = y - start;
        scrollControlRef.current.target = clamp(0, limit, currentRelative) / limit;
        scrollControlRef.current.current = lerp(scrollControlRef.current.current, scrollControlRef.current.target, scrollLerp);
        timeline?.progress(scrollControlRef.current.current);
        // Update post uniform directly if timeline not used or for direct control
        postRef.current.passes[0].uniforms.uStart.value = scrollControlRef.current.current;
      }

      // Update hover effect (if applicable)
      hoverControlRef.current.value = lerp(hoverControlRef.current.value, hoverControlRef.current.target, hoverControlRef.current.lerp);
      postRef.current.passes[0].uniforms.uHover.value = hoverControlRef.current.value;

      // Update video textures
      texturesRef.current.forEach(tex => {
          if (tex?.image?.tagName === 'VIDEO') {
              const videoElement = tex.image;
              if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA) {
                  tex.needsUpdate = true;
              }
          }
      });

      // Render scene through post-processing
      postRef.current.render({ scene: sceneRef.current, camera: contextCamera });
    };

    if (isActive) {
      rafIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isActive, contextCamera]); // Depend on active state and global camera

  // Render the dedicated canvas
  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvasElement} ${className}`}
      style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        opacity: isActive || isExiting ? 1 : 0, // Use state for opacity
        transition: 'opacity 0.6s ease',
        filter: isExiting ? 'blur(4px)' : 'none',
        pointerEvents: 'none', // Canvas usually doesn't need interaction itself
      }}
    />
  );
});

Sl.displayName = 'Sl'; // Add display name
export default Sl; // Ensure single default export

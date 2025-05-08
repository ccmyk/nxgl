// components/webgl/Pg.jsx
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Renderer, Camera, Transform, Program, Mesh, Texture, Plane, Vec2 } from 'ogl';
import gsap from 'gsap';
import styles from './Pg.module.pcss'; // Assuming basic styles exist
import fragmentShader from '@/shaders/pg/main.frag.glsl'; // Import shaders
import vertexShader from '@/shaders/pg/main.vert.glsl';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { useLenis } from '@/hooks/useLenis';
import { clamp, lerp } from '@/lib/math';
import { useViewport } from '@/hooks/useViewport'; // Use viewport hook

// This component expects refs to the individual grid item divs (.el)
// and potentially their media elements if textures are dynamic per item.
export default function Pg({
  gridItems = [], // Array of { id: string|number, mediaSrc: string, mediaType: 'image'|'video', elementRef: RefObject }
  isVisible = true,
  ioRefSelf, // Ref for the main grid container IO trigger
  ioOptions = { threshold: 0 }, // Trigger early
  touch = false,
  device = 0, // Pass device type (0=desktop, 1=tabletL, 2=tabletS, 3=mobile)
  className = '',
}) {
  const canvasRef = useRef(null); // Shared canvas for the grid
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const meshesRef = useRef([]); // Array to hold { mesh, texture, elRef, data, ... }
  const programRef = useRef(null); // Shared program reference
  const geometryRef = useRef(null); // Shared geometry reference
  const rafIdRef = useRef(null);
  const isMountedRef = useRef(false);
  const viewport = useViewport(); // Get window dimensions

  const [isActive, setIsActive] = useState(false);
  const activeItems = useRef(new Set()); // Track items currently in view

  // Mouse interaction state
  const hoveredItemIndex = useRef(null);
  const mousePositionRef = useRef({ x: 0, y: 0 });

  // Use IO hook on the main container
  const [isInView] = useIntersectionObserver(ioRefSelf, ioOptions);

  // Use Lenis for scroll position
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
    if (!canvasRef.current || !isInitialized || gridItems.length === 0) return;
    isMountedRef.current = true;

    let renderer, scene, camera, geometry, program;
    const meshes = [];
    const textures = [];

    try {
      // --- OGL Setup (derived from 🧮/base.js constructor) ---
      renderer = new Renderer({ canvas: canvasRef.current, alpha: true, dpr: Math.min(window.devicePixelRatio, 2) });
      const gl = renderer.gl;
      rendererRef.current = renderer;

      camera = new Camera(gl, { fov: 45 }); // Use a standard camera setup
      camera.position.z = 7; // Adjust as needed
      cameraRef.current = camera;

      scene = new Transform();
      sceneRef.current = scene;

      geometry = new Plane(gl); // Use Plane geometry for each grid item
      geometryRef.current = geometry;

      // --- Create Shared Program ---
      program = new Program(gl, {
        vertex: vertexShader,
        fragment: fragmentShader,
        uniforms: {
          uTime: { value: 0 },
          uStart: { value: 0 }, // Not used in PG shaders?
          uZoom: { value: 1 }, // Controlled by hover/selection
          uMove: { value: 1 }, // Controlled by hover/selection
          tMap: { value: null }, // Set per mesh
          uCover: { value: new Vec2(1, 1) }, // Set per mesh on resize
          uTextureSize: { value: new Vec2(1, 1) }, // Set per mesh on load
          uMouse: { value: 0 }, // Distortion amount based on hover
          uLoad: { value: 0 }, // Fade-in control
        },
        transparent: true,
      });
      programRef.current = program;

      // --- Create Meshes and Load Textures ---
      gridItems.forEach((item, index) => {
        const texture = new Texture(gl, { generateMipmaps: false });
        textures.push(texture);

        // Create a *unique* program instance for each mesh if uniforms need to be independent
        // OR share the program and update uniforms just before drawing each mesh (more efficient)
        // For simplicity here, we'll assume shared program, update uniforms in render loop
        const mesh = new Mesh(gl, { geometry, program });
        mesh.setParent(scene);

        const meshData = {
          mesh, texture, elRef: item.elementRef, data: item, // Store original item data
          id: item.id, pos: index, loaded: 0,
          bounds: { x: 0, y: 0, width: 1, height: 1 }, // Store bounds
          uniforms: { // Store local uniform state if needed, or update global program uniforms
              uLoad: 0, uZoom: 1, uMove: 1, uMouse: 0,
              uTextureSize: new Vec2(1,1), uCover: new Vec2(1,1),
              tMap: texture // Reference the unique texture
          },
          quickToMouse: gsap.quickTo(program.uniforms.uMouse, 'value', { duration: 0.8, ease: "power1" }), // GSAP helper per mesh
        };
        meshes.push(meshData);
        meshesRef.current.push(meshData);

        // --- Load Media ---
        const isVideo = item.mediaType === 'video';
        const element = isVideo ? document.createElement('video') : new Image();

        const updateTextureAndSize = (loadedMedia) => {
           texture.image = loadedMedia;
           const naturalWidth = isVideo ? loadedMedia.videoWidth : loadedMedia.naturalWidth;
           const naturalHeight = isVideo ? loadedMedia.videoHeight : loadedMedia.naturalHeight;
           meshData.uniforms.uTextureSize = [naturalWidth || 1, naturalHeight || 1]; // Update local state
           meshData.loaded = 1;
           gsap.to(meshData.uniforms, { uLoad: 1, duration: 0.6, delay: 0.1, ease: 'power2.inOut' }); // Animate fade-in
           handleResize(); // Update layout after load
        };

        if (isVideo) {
            element.muted = true; element.loop = true; element.playsInline = true;
            element.autoplay = false; element.preload = 'metadata';
            element.onloadedmetadata = () => updateTextureAndSize(element);
            element.src = item.mediaSrc;
            element.load();
        } else {
            element.onload = () => updateTextureAndSize(element);
            element.onerror = () => console.error("Failed to load image:", item.mediaSrc);
            element.src = item.mediaSrc;
        }
      });

      console.log('Pg Initialized');

    } catch (e) { console.error("Error initializing Pg:", e); }

    // Cleanup
    return () => {
      isMountedRef.current = false;
      cancelAnimationFrame(rafIdRef.current);
      meshesRef.current.forEach(m => {
        scene?.removeChild(m.mesh);
        m.texture?.dispose();
        // Program and Geometry are shared, dispose once if needed, or let context handle
      });
      meshesRef.current = [];
      // geometryRef.current?.dispose(); // Dispose shared geometry
      // programRef.current?.gl?.deleteProgram(programRef.current.program); // Dispose shared program
      renderer?.dispose();
      console.log("Pg Cleanup");
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isInitialized, gridItems]); // Re-init if gridItems change

  // --- Resize Handler ---
  const handleResize = useCallback(() => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const canvas = canvasRef.current;
    if (!renderer || !camera || !canvas || meshesRef.current.length === 0) return;

    const width = window.innerWidth; // Use full window size for renderer
    const height = window.innerHeight;
    renderer.setSize(width, height);

    camera.perspective({ aspect: width / height });

    // Calculate viewport units
    const fov = camera.fov * (Math.PI / 180);
    const viewportHeight = 2 * Math.tan(fov / 2) * camera.position.z;
    const viewportWidth = viewportHeight * camera.aspect;

    // Update mesh positions and scales based on their DOM elements
    meshesRef.current.forEach(item => {
      const el = item.elRef?.current;
      if (!el) return;
      const bound = el.getBoundingClientRect();
      item.bounds = { x: bound.left, y: bound.top, width: bound.width, height: bound.height };

      // Calculate scale to fit element bounds
      item.mesh.scale.x = viewportWidth * (bound.width / width);
      item.mesh.scale.y = viewportHeight * (bound.height / height);

      // Calculate position (center of element mapped to viewport)
      item.mesh.position.x = (bound.left + bound.width / 2 - width / 2) / width * viewportWidth;
      item.mesh.position.y = -(bound.top + bound.height / 2 - height / 2) / height * viewportHeight;

      // Update cover uniform for this mesh
      item.uniforms.uCover = [bound.width, bound.height];
    });

  }, [cameraRef]); // Depend on camera ref

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  // --- IO and Active State ---
  useEffect(() => {
    // Activate rendering when the main container is in view
    setIsActive(isInView);
    if (!isInView) {
        // Pause videos when container is out of view
        meshesRef.current.forEach(item => {
            if (item.texture?.image?.tagName === 'VIDEO') item.texture.image.pause();
        });
    }
  }, [isInView]);

  // --- Individual Item IO (using refs passed in gridItems) ---
  useEffect(() => {
      const observers = [];
      meshesRef.current.forEach((item, index) => {
          const node = item.elRef?.current;
          if (!node) return;

          const observer = new IntersectionObserver(([entry]) => {
              if (entry.isIntersecting) {
                  activeItems.current.add(index);
                  if (item.texture?.image?.tagName === 'VIDEO') {
                      item.texture.image.play().catch(e=>console.warn("Vid play fail"));
                  }
              } else {
                  activeItems.current.delete(index);
                  if (item.texture?.image?.tagName === 'VIDEO') {
                      item.texture.image.pause();
                  }
              }
          }, { threshold: 0 }); // Trigger as soon as visible

          observer.observe(node);
          observers.push(observer);
      });

      return () => {
          observers.forEach(obs => obs.disconnect());
          activeItems.current.clear();
      };
  }, []); // Run once after meshes are created

  // --- Mouse Interaction ---
  useEffect(() => {
    if (touch) return; // No hover on touch

    const handleMouseMove = (e) => {
        mousePositionRef.current = { x: e.clientX, y: e.clientY };
        let currentlyHovered = null;
        // Find which item the mouse is over
        meshesRef.current.forEach((item, index) => {
            const bounds = item.bounds;
            if (e.clientX >= bounds.x && e.clientX <= bounds.x + bounds.width &&
                e.clientY >= bounds.y && e.clientY <= bounds.y + bounds.height) {
                currentlyHovered = index;
            }
        });
        hoveredItemIndex.current = currentlyHovered;
    };

    const handleMouseLeave = () => {
        hoveredItemIndex.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseleave', handleMouseLeave); // Use body for leave

    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [touch]);

  // --- Render Loop ---
  useEffect(() => {
    if (!isMountedRef.current) return;

    const renderLoop = (time) => {
      rafIdRef.current = requestAnimationFrame(renderLoop);
      if (!isActive || !rendererRef.current || !sceneRef.current || !cameraRef.current || !programRef.current || !isMountedRef.current) {
          return; // Stop if inactive or unmounted
      }

      const y = currentScrollY.current; // Get current scroll position

      // Update uniforms and render only active meshes
      activeItems.current.forEach(index => {
          const item = meshesRef.current[index];
          if (!item) return;

          // Update position based on scroll (recalculate Y)
          const screenH = viewport.height;
          item.mesh.position.y = -(item.bounds.y + item.bounds.height / 2 - screenH / 2 - y) / screenH * viewportUnits.current.height;

          // Update mouse distortion uniform
          let targetMouse = 0;
          if (hoveredItemIndex.current === index) {
              const relativeX = (mousePositionRef.current.x - item.bounds.x) / item.bounds.width;
              targetMouse = (relativeX - 0.5) * -1; // Map 0-1 to 0.5 -> -0.5
          }
          // Use the quickTo function for smooth interpolation
          item.quickToMouse(targetMouse);

          // Update texture if video
          if (item.texture?.image?.tagName === 'VIDEO') {
              const videoElement = item.texture.image;
              if (videoElement.readyState >= videoElement.HAVE_ENOUGH_DATA) {
                  item.texture.needsUpdate = true;
              }
          }

          // Update shared program uniforms for this mesh
          programRef.current.uniforms.tMap.value = item.texture;
          programRef.current.uniforms.uTextureSize.value = item.uniforms.uTextureSize;
          programRef.current.uniforms.uCover.value = item.uniforms.uCover;
          programRef.current.uniforms.uLoad.value = item.uniforms.uLoad;
          programRef.current.uniforms.uZoom.value = item.uniforms.uZoom;
          programRef.current.uniforms.uMove.value = item.uniforms.uMove;
          // uMouse is updated via quickTo

          // Render this mesh individually (less efficient but simpler for varying uniforms)
          // OR update uniforms and render the whole scene once (more efficient)
          // rendererRef.current.render({ scene: item.mesh, camera: cameraRef.current });
      });

      // Render the whole scene once after updating all relevant uniforms
       programRef.current.uniforms.uTime.value = time * 0.001; // Update global time
       rendererRef.current.render({ scene: sceneRef.current, camera: cameraRef.current });

    };

    if (isActive) {
      rafIdRef.current = requestAnimationFrame(renderLoop);
    }

    return () => {
      cancelAnimationFrame(rafIdRef.current);
    };
  }, [isActive, viewport, currentScrollY]); // Depend on active state and viewport

  // Render the shared canvas for the grid
  return (
    <canvas
      ref={canvasRef}
      className={`${styles.canvasElement} ${className}`}
      style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        zIndex: 1, // Position behind interactive elements but above background
        pointerEvents: 'none', // Canvas itself doesn't need clicks
        opacity: isActive ? 1 : 0, // Fade in/out based on container visibility
        transition: 'opacity 0.5s ease',
      }}
    />
  );
}

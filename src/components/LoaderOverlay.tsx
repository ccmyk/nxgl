'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useAnimBus } from '@/hooks/useAnimBus';
import { useAppStore } from '@/stores/app';

export function LoaderOverlay() {
  const elRef = useRef<HTMLDivElement | null>(null);
  const numRef = useRef<HTMLDivElement | null>(null);
  const animBus = useAnimBus();
  const isLoad = useAppStore((s) => s.isLoad);

  useEffect(() => {
    if (!elRef.current || !numRef.current) return;
    const obj = { num: 0 };
    const tl = gsap.timeline({ paused: true })
      .fromTo(obj, { num: 0 }, {
        num: 42, ease: 'none', duration: 2,
        onUpdate: () => updateCounter()
      }, 0)
      .to(obj, {
        num: 90, ease: 'power2.inOut', duration: 8,
        onUpdate: () => updateCounter()
      }, 2.2);

    const aw = elRef.current.querySelectorAll('.Awrite');
    if (aw[0]) { animBus.dispatch({ state: 0, style: 0, el: aw[0] as HTMLElement }); }
    if (aw[1]) { animBus.dispatch({ state: 0, style: 0, el: aw[1] as HTMLElement }); }

    function updateCounter() {
      const v = Math.max(0, Math.min(100, Math.round(obj.num)));
      numRef.current!.innerHTML = v.toString().padStart(3, '0');
    }

    if (isLoad) {
      tl.play();
    } else {
      gsap.to(obj, {
        num: 100, ease: 'power2.inOut', duration: 0.49,
        onUpdate: updateCounter
      });
      gsap.to(elRef.current, {
        opacity: 0, duration: 0.5, delay: 0.2, ease: 'power2.inOut',
        onComplete: () => elRef.current?.remove()
      });
    }

    return () => { tl.kill(); };
  }, [animBus, isLoad]);

  if (!isLoad) return null;

  return (
    <div ref={elRef} className="loader">
      <div className="loader_bg"></div>
      <div className="loader_cnt">
        <div ref={numRef} className="loader_tp">000</div>
        {/* any Awrite children go here to mirror original */}
      </div>
    </div>
  );
}
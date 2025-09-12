// src/hooks/useWriteAnim.ts
'use client';
import { useEffect, useRef } from 'react';
import { gsap, SplitText } from '@/lib/gsapSetup';
import { useAnimBus } from '@/hooks/useAnimBus';

// Replicates the `fakes` string and random function from the original project
const fakes = '##·$%&/=€|()@+09*+]}{[';
const getRnd = (max: number) => Math.floor(Math.random() * max);

/**
 * A declarative React hook to handle all "write" animations from the original project.
 * It uses GSAP's SplitText for the initial text splitting and correctly handles all
 * variations based on element classes like .Atext, .Aline, .Ms, and .Awrite-inv.
 *
 * @param elRef A React ref to the target HTMLElement.
 */
export function useWriteAnim(elRef: React.RefObject<HTMLElement>) {
  const splitRef = useRef<SplitText | null>(null);

  // 1. SETUP EFFECT (Replicates `writeCt`)
  // This effect runs once to prepare the DOM for animation based on element classes.
  useEffect(() => {
    const node = elRef.current;
    if (!node) return;

    if (node.classList.contains('Atext') || node.classList.contains('Aline')) {
      const spty = new SplitText(node.querySelectorAll('.Atext_el, .Aline_el, p'), {
        type: 'lines',
        linesClass: 'line',
      });
      splitRef.current = spty;
      if (node.classList.contains('Atext')) {
        spty.lines.forEach((line, i) => {
          line.dataset.params = `${i * 0.15}`; // Set stagger delay for child lines
          // The setup for characters within these lines will be handled by their own hooks
        });
      }
    } else {
      const st = new SplitText(node, { type: 'chars,words', charsClass: 'char' });
      splitRef.current = st;
      st.chars?.forEach((char) => {
        char.innerHTML = `<span class="n">${char.innerHTML}</span>`;
        for (let i = 0; i < 2; i++) {
          const fakeChar = fakes[getRnd(fakes.length - 1)];
          char.insertAdjacentHTML('afterbegin', `<span class="f" aria-hidden="true">${fakeChar}</span>`);
        }
      });
    }

    node.style.opacity = '0'; // Hide until animated in

    return () => {
      splitRef.current?.revert();
    };
  }, [elRef]);

  // 2. ANIMATION EFFECT (Replicates `writeFn`)
  // Subscribes to the event bus and runs the appropriate animation.
  useEffect(() => {
    const node = elRef.current;
    if (!node) return;

    const off = useAnimBus.getState().on((detail) => {
      if (detail.el !== node || detail.style !== 0) return;

      gsap.killTweensOf(node.querySelectorAll('.char, .line'));
      gsap.killTweensOf(node);

      // --- Animate In (state: 1) ---
      if (detail.state === 1) {
        let params = [0, 3];
        if (node.dataset.params) {
          params = node.dataset.params.split(',').map(Number);
        }

        if (node.classList.contains('Atext')) {
          node.style.opacity = '1';
          const lines = node.querySelectorAll('.line') as NodeListOf<HTMLElement>;
          lines.forEach(line => useAnimBus.getState().dispatch({ el: line, state: 1, style: 0 }));
          return;
        }

        if (node.classList.contains('Aline')) {
          const lines = node.querySelectorAll('.line');
          const anim = gsap.timeline({ onComplete: () => node.classList.add('ivi') });
          anim.set(node, { opacity: 1 }, 0);
          anim.fromTo(lines, { opacity: 0, yPercent: 50 }, { opacity: 1, yPercent: 0, duration: 0.6, ease: 'power4.inOut', stagger: 0.1 });
          return;
        }

        const chars = Array.from(node.querySelectorAll('.char')) as HTMLElement[];
        const anim = gsap.timeline({ onComplete: () => node.classList.add('ivi') });

        // Correctly select the timing array based on the class
        let times = [0.3, 0.05, 0.16, 0.05, 0.016]; // Default for .line and others
        if (node.classList.contains('Ms')) {
            times = [0.22, 0.05, 0.16, 0.05, 0.016]; // Special timing for .Ms
        }

        if (node.classList.contains('Awrite-inv')) {
          anim.to(node, { opacity: 1, immediateRender: false, ease: 'power4.inOut' }, params[0]);
        } else {
          anim.set(node, { opacity: 1 }, 0);
        }

        chars.forEach((char, i) => {
          const n = char.querySelector('.n');
          const fSpans = char.querySelectorAll('.f');
          const delay = params[0] + (i * times[1]);
          anim.set(char, { opacity: 1 }, 0)
              .to(n, { opacity: 1, duration: times[0], ease: 'power4.inOut' }, delay);
          fSpans.forEach((f, u) => {
            const fDelay = params[0] + (i * times[3] + (1 + u) * times[4]);
            anim.set(f, { opacity: 0, display: 'block' }, 0)
                .fromTo(f, { scaleX: 1, opacity: 1 }, { scaleX: 0, opacity: 0, duration: times[2], ease: 'power4.inOut' }, fDelay)
                .set(f, { display: 'none' }, '>');
          });
        });

        if (node.dataset.bucle) {
          anim.eventCallback('onComplete', () => {
            node.classList.add('ivi');
            if (node.classList.contains('inview')) {
              useAnimBus.getState().dispatch({ el: node, state: 1, style: 0 });
            }
          });
        }
      }

      // --- Animate Out (state: -1) ---
      if (detail.state === -1) {
        node.classList.remove('ivi');
        if (node.classList.contains('Atext') || node.classList.contains('Aline')) {
            const lines = Array.from(node.querySelectorAll('.line')).reverse();
            gsap.timeline()
                .to(lines, { opacity: 0, duration: 0.2, stagger: 0.04 })
                .to(node, { opacity: 0, duration: 0.4 }, 0.1 * lines.length);
        } else if (node.classList.contains('Awrite')) {
            const chars = Array.from(node.querySelectorAll('.char')).reverse();
            const anim = gsap.timeline();
            chars.forEach((char, i) => {
                const fSpans = char.querySelectorAll('.f');
                anim.to(fSpans, { opacity: 1, scaleX: 1, duration: 0.12, ease: 'power4.inOut' }, i * 0.04)
                    .to(char, { opacity: 0, duration: 0.2, ease: 'power4.inOut' }, i * 0.04);
            });
            anim.to(node, { opacity: 0, duration: 0.4 }, '-=0.2');
        }
      }
    });

    return () => off();
  }, [elRef]);
}


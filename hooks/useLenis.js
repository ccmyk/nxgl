// hooks/useLenis.js
'use client';

import { useLenis as useLenisContext } from '@/contexts/LenisContext';

export function useLenis() {
  return useLenisContext();
}

/*
// --- Example Usage in a Component ---
import { useLenis } from '@/hooks/useLenis';

function MyComponent() {
  const { lenis, scrollTo } = useLenis(); // Get ref and scrollTo function

  useEffect(() => {
    // Access the instance via .current
    if (lenis.current) {
      console.log("Lenis instance:", lenis.current);
      // You can call methods directly if needed, e.g., lenis.current.start()
    }
  }, [lenis]);

  const handleScrollToTop = () => {
    scrollTo(0); // Use the context's scrollTo helper
  };

  return <button onClick={handleScrollToTop}>Scroll Top</button>;
}
*/

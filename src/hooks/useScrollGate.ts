import { useRef, useState, useCallback } from 'react';

export function useScrollGate(threshold = 24) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrolledToEnd, setScrolledToEnd] = useState(false);

  const onScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
      setScrolledToEnd(true);
    }
  }, [threshold]);

  return { scrollRef, scrolledToEnd, onScroll };
}

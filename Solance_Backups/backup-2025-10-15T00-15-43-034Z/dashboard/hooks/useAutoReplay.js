import { useEffect, useState, useRef } from "react";

export function useAutoReplay(messages, intervalMs = 100, sliceSize = 10) {
  const [replay, setReplay] = useState([]);
  const [isReplaying, setIsReplaying] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isReplaying && messages.length > 0) {
      timerRef.current = setInterval(() => {
        setReplay((prev) => {
          const nextIndex = indexRef.current + sliceSize;
          const slice = messages.slice(indexRef.current, nextIndex);
          indexRef.current = nextIndex;
          if (slice.length === 0) {
            clearInterval(timerRef.current);
            setIsReplaying(false);
            return prev;
          }
          return [...prev, ...slice];
        });
      }, intervalMs);
    }
    return () => clearInterval(timerRef.current);
  }, [isReplaying, messages, intervalMs, sliceSize]);

  const startReplay = () => {
    setReplay([]);
    indexRef.current = 0;
    setIsReplaying(true);
  };

  return { replay, isReplaying, startReplay };
}

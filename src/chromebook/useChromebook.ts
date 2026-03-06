import { useState, useEffect } from 'react';

export function useChromebook() {
  const [isChromebookMode, setIsChromebookMode] = useState(false);

  useEffect(() => {
    // Detect if running on a "Chromebook" (simulated or real)
    const isChromeOS = /\bCrOS\b/.test(navigator.userAgent);
    if (isChromeOS) {
      setIsChromebookMode(true);
    }
  }, []);

  const toggleSandbox = () => {
    setIsChromebookMode(prev => !prev);
    return !isChromebookMode;
  };

  return {
    isChromebookMode,
    setIsChromebookMode,
    toggleSandbox
  };
}

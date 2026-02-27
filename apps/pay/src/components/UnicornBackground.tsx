'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    UnicornStudio?: {
      isInitialized: boolean;
      init: () => void;
    };
  }
}

export function UnicornBackground() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const us = window.UnicornStudio;
    if (us && us.init) {
      us.init();
      return;
    }

    // Bootstrap UnicornStudio global before script loads
    window.UnicornStudio = { isInitialized: false, init: () => {} };

    const script = document.createElement('script');
    script.src =
      'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js';
    script.onload = () => {
      window.UnicornStudio?.init();
    };
    document.head.appendChild(script);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none unicorn-bg">
      <div
        data-us-project="0yi1cjXSYJ4SgAxIe9Ke"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

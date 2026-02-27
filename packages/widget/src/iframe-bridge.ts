export interface PaymentMessage {
  type: 'zkira-payment-success' | 'zkira-payment-error' | 'zkira-payment-cancel' | 'zkira-payment-loaded';
  data?: any;
}

export interface IframeOptions {
  onMessage?: (message: PaymentMessage) => void;
  onClose?: () => void;
  onLoad?: () => void;
  zIndex?: number;
  theme?: 'light' | 'dark';
}

interface ZkiraIframe {
  iframe: HTMLIFrameElement;
  overlay: HTMLDivElement;
  cleanup: () => void;
}

// Store active iframes to manage multiple instances
const activeIframes = new Set<ZkiraIframe>();

/**
 * Creates and mounts a payment iframe with overlay
 */
export async function createZkiraPaymentIframe(
  payUrl: string,
  options: IframeOptions = {}
): Promise<HTMLIFrameElement> {
  const {
    onMessage,
    onClose,
    onLoad,
    zIndex = 10000,
    theme = 'dark',
  } = options;

  // Create overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.7);
    z-index: ${zIndex};
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
  `;

  // Create iframe container
  const iframeContainer = document.createElement('div');
  iframeContainer.style.cssText = `
    position: relative;
    width: 90vw;
    max-width: 500px;
    height: 90vh;
    max-height: 700px;
    background-color: ${theme === 'dark' ? '#000000' : '#ffffff'};
    border: 1px solid ${theme === 'dark' ? '#333333' : '#cccccc'};
    border-radius: 0px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '&times;';
  closeButton.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    width: 32px;
    height: 32px;
    border: none;
    background-color: transparent;
    color: ${theme === 'dark' ? '#ffffff' : '#000000'};
    font-size: 24px;
    font-weight: bold;
    cursor: pointer;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0px;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  `;

  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.opacity = '1';
    closeButton.style.backgroundColor = theme === 'dark' ? '#1a1a1a' : '#f5f5f5';
  });

  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.opacity = '0.7';
    closeButton.style.backgroundColor = 'transparent';
  });

  // Create iframe
  const iframe = document.createElement('iframe');
  iframe.src = payUrl;
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 0px;
    background-color: ${theme === 'dark' ? '#000000' : '#ffffff'};
  `;

  // Allow necessary permissions
  iframe.setAttribute('allow', 'camera; microphone; payment; publickey-credentials-get; cross-origin-isolated');
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox');

  // Message listener for iframe communication
  const messageListener = (event: MessageEvent) => {
    // Verify origin for security (in production, verify against actual pay app domain)
    const allowedOrigins = [
      'https://app.zkira.xyz',
      'http://localhost:3001',
      'http://localhost:3000'
    ];

    if (!allowedOrigins.includes(event.origin)) {
      return;
    }

    const message = event.data as PaymentMessage;

    // Handle ZKIRA payment messages
    if (message && typeof message === 'object' && message.type?.startsWith('zkira-payment-')) {
      onMessage?.(message);

      // Auto-close on success, error, or cancel
      if (['zkira-payment-success', 'zkira-payment-error', 'zkira-payment-cancel'].includes(message.type)) {
        destroyZkiraPaymentIframe();
      }
    }
  };

  // Cleanup function
  const cleanup = () => {
    window.removeEventListener('message', messageListener);
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    activeIframes.delete(zkiraIframe);
  };

  // Close button handler
  const handleClose = () => {
    cleanup();
    onClose?.();
  };

  closeButton.addEventListener('click', handleClose);

  // Escape key handler
  const escapeKeyHandler = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      handleClose();
    }
  };

  // Overlay click handler (close on backdrop click)
  const overlayClickHandler = (event: MouseEvent) => {
    if (event.target === overlay) {
      handleClose();
    }
  };

  // Set up event listeners
  window.addEventListener('message', messageListener);
  document.addEventListener('keydown', escapeKeyHandler);
  overlay.addEventListener('click', overlayClickHandler);

  // Load handler
  iframe.addEventListener('load', () => {
    onLoad?.();
  });

  // Enhance cleanup to remove all event listeners
  const enhancedCleanup = () => {
    window.removeEventListener('message', messageListener);
    document.removeEventListener('keydown', escapeKeyHandler);
    overlay.removeEventListener('click', overlayClickHandler);
    if (overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    activeIframes.delete(zkiraIframe);
  };

  // Assemble DOM structure
  iframeContainer.appendChild(iframe);
  iframeContainer.appendChild(closeButton);
  overlay.appendChild(iframeContainer);
  document.body.appendChild(overlay);

  // Create iframe object for tracking
  const zkiraIframe: ZkiraIframe = {
    iframe,
    overlay,
    cleanup: enhancedCleanup,
  };

  activeIframes.add(zkiraIframe);

  return iframe;
}

/**
 * Destroys the currently active payment iframe
 */
export function destroyZkiraPaymentIframe(): void {
  // Close all active iframes
  const iframes = Array.from(activeIframes);
  iframes.forEach(zkiraIframe => {
    zkiraIframe.cleanup();
  });
  activeIframes.clear();
}

/**
 * Check if a payment iframe is currently open
 */
export function isPaymentIframeOpen(): boolean {
  return activeIframes.size > 0;
}

/**
 * Send a message to all active payment iframes
 */
export function sendMessageToPaymentIframes(message: any): void {
  activeIframes.forEach(zkiraIframe => {
    try {
      if (zkiraIframe.iframe.contentWindow) {
        zkiraIframe.iframe.contentWindow.postMessage(message, '*');
      }
    } catch (error) {
      console.warn('Failed to send message to iframe:', error);
    }
  });
}
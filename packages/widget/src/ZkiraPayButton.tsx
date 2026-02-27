import React, { useState, useEffect } from 'react';
import { createZkiraPaymentIframe, destroyZkiraPaymentIframe } from './iframe-bridge.js';

export interface ZkiraPayButtonProps {
  amount: number;
  token?: string; // default 'USDC'
  label?: string; // button text
  theme?: 'light' | 'dark';
  payAppUrl?: string; // default 'https://app.zkira.xyz'
  onSuccess?: (data: { txSignature: string }) => void;
  onError?: (error: Error) => void;
  onCancel?: () => void;
}

const ZkiraPayButton: React.FC<ZkiraPayButtonProps> = ({
  amount,
  token = 'USDC',
  label = 'Pay with ZKIRA',
  theme = 'dark',
  payAppUrl = 'https://app.zkira.xyz',
  onSuccess,
  onError,
  onCancel,
}) => {
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Clean up iframe on unmount
  useEffect(() => {
    return () => {
      if (isPaymentOpen) {
        destroyZkiraPaymentIframe();
      }
    };
  }, [isPaymentOpen]);

  const handlePaymentClick = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setIsPaymentOpen(true);

      // Create payment URL with parameters
      const payUrl = new URL(payAppUrl);
      payUrl.searchParams.set('amount', amount.toString());
      payUrl.searchParams.set('token', token);

      // Create iframe overlay
      const iframe = await createZkiraPaymentIframe(payUrl.toString(), {
        onMessage: (message) => {
          switch (message.type) {
            case 'zkira-payment-success':
              setIsPaymentOpen(false);
              setIsLoading(false);
              onSuccess?.(message.data);
              break;
            
            case 'zkira-payment-error':
              setIsPaymentOpen(false);
              setIsLoading(false);
              onError?.(new Error(message.data.error || 'Payment failed'));
              break;
            
            case 'zkira-payment-cancel':
              setIsPaymentOpen(false);
              setIsLoading(false);
              onCancel?.();
              break;
          }
        },
        onClose: () => {
          setIsPaymentOpen(false);
          setIsLoading(false);
          onCancel?.();
        },
      });

    } catch (error) {
      setIsLoading(false);
      setIsPaymentOpen(false);
      onError?.(error instanceof Error ? error : new Error('Failed to open payment'));
    }
  };

  // ZKIRA button styles
  const buttonStyles: React.CSSProperties = {
    backgroundColor: theme === 'dark' ? '#000000' : '#ffffff',
    color: theme === 'dark' ? '#ffffff' : '#000000',
    border: theme === 'dark' ? '1px solid #333333' : '1px solid #cccccc',
    borderRadius: '0px', // No rounded corners per ZKIRA design
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: '600',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    opacity: isLoading ? 0.7 : 1,
    transition: 'all 0.2s ease',
    minWidth: '140px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  };

  const hoverStyles: React.CSSProperties = {
    ...buttonStyles,
    backgroundColor: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
  };

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      <button
        style={isHovered ? hoverStyles : buttonStyles}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handlePaymentClick}
        disabled={isLoading}
        type="button"
      >
        {isLoading ? (
          <>
            <span
              style={{
                width: '16px',
                height: '16px',
                border: '2px solid',
                borderColor: theme === 'dark' ? '#ffffff' : '#000000',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
            Processing...
          </>
        ) : (
          <>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            {label}
          </>
        )}
      </button>

      {/* Add CSS animation for loading spinner */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `
      }} />
    </>
  );
};

export default ZkiraPayButton;
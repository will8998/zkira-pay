'use client';

import { useState } from 'react';
import { validateInviteCode } from '@/lib/api';

interface InviteGateProps {
  onUnlock: (code: string) => void;
}

export default function InviteGate({ onUnlock }: InviteGateProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Format code as user types (ZKRA-XXXX-XXXX)
  const formatCode = (input: string) => {
    const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (cleaned.length <= 4) return cleaned;
    if (cleaned.length <= 8) return `${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
    return `${cleaned.slice(0, 4)}-${cleaned.slice(4, 8)}-${cleaned.slice(8, 12)}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCode(e.target.value);
    setCode(formatted);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || loading) return;

    setLoading(true);
    setError('');

    try {
      const result = await validateInviteCode(code);
      if (!result.valid) {
        setError('Invalid invite code');
      } else if (result.used) {
        setError('Invite code already used');
      } else {
        onUnlock(code);
      }
    } catch {
      setError('Failed to validate code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-zkira-bg flex items-center justify-center z-50 animate-fade-in">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Lock Icon */}
        <div className="mb-8 flex justify-center">
          <div className="animate-pulse">
            <svg
              className="w-16 h-16 text-zkira-green"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        </div>

        {/* Heading */}
        <h1
          className="font-orbitron font-normal text-3xl md:text-4xl text-white mb-4"
          style={{ textShadow: '0 0 30px rgba(255, 23, 68, 0.3)' }}
        >
          PRIVATE ACCESS
        </h1>

        {/* Subtext */}
        <p className="text-zkira-text-secondary text-lg mb-8">
          Enter your invite code to continue
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Input */}
          <div>
            <input
              type="text"
              value={code}
              onChange={handleInputChange}
              placeholder="ZKRA-XXXX-XXXX"
              className="w-full bg-zkira-input border border-zkira-border rounded-lg px-4 py-4 text-center text-xl font-mono text-white placeholder-zkira-text-muted focus:outline-none focus:border-zkira-green focus:ring-1 focus:ring-zkira-green transition-colors"
              maxLength={14}
              autoComplete="off"
              autoFocus
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-zkira-red text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!code || loading}
            className="w-full bg-zkira-green hover:bg-zkira-green/90 disabled:bg-zkira-green/50 disabled:cursor-not-allowed text-black font-orbitron font-medium text-lg py-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                VALIDATING...
              </>
            ) : (
              'UNLOCK'
            )}
          </button>
        </form>

        {/* Footer hint */}
        <p className="text-zkira-text-muted text-sm mt-8">
          Each code allows one swap only
        </p>
      </div>
    </div>
  );
}

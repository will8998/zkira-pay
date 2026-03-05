/**
 * Whitelabel configuration system for OMNIPAY partners.
 * Allows partners to customize branding via environment variables.
 */

export interface WhitelabelConfig {
  /** Partner display name (e.g., "BetShield Privacy") */
  appName: string;
  /** Logo URL (absolute or relative) */
  logoUrl: string;
  /** Primary brand color (hex, e.g., "#6366f1") */
  primaryColor: string;
  /** Footer text */
  footerText: string;
  /** Whether this is a whitelabel deployment */
  isWhitelabel: boolean;
  /** Partner/distributor ID for volume tracking (UUID from distributors table) */
  partnerId: string | null;
}

/**
 * Load whitelabel configuration from environment variables.
 * Partners deploy with custom env vars to brand their deployment.
 * 
 * Example partner deployment env vars:
 * ```
 * NEXT_PUBLIC_APP_NAME="BetShield Privacy"
 * NEXT_PUBLIC_LOGO_URL="https://betshield.com/logo.svg"
 * NEXT_PUBLIC_PRIMARY_COLOR="#10b981"
 * NEXT_PUBLIC_FOOTER_TEXT="© 2026 BetShield. Powered by OMNIPAY."
 * NEXT_PUBLIC_IS_WHITELABEL=true
 * NEXT_PUBLIC_PARTNER_ID="uuid-of-distributor"
 * ```
 */
export function getWhitelabelConfig(): WhitelabelConfig {
  return {
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'OMNIPAY',
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '/logo.svg',
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#6366f1',
    footerText: process.env.NEXT_PUBLIC_FOOTER_TEXT || '© 2026 OMNIPAY. Private payments on Arbitrum.',
    isWhitelabel: process.env.NEXT_PUBLIC_IS_WHITELABEL === 'true',
    partnerId: process.env.NEXT_PUBLIC_PARTNER_ID || null,
  };
}

/**
 * Apply whitelabel theming to CSS custom properties.
 * Call this in your root layout or app component.
 */
export function applyWhitelabelTheme(config: WhitelabelConfig): void {
  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    
    // Apply primary color to CSS custom property
    root.style.setProperty('--color-whitelabel-primary', config.primaryColor);
    
    // If whitelabel, override button colors
    if (config.isWhitelabel) {
      root.style.setProperty('--color-button', config.primaryColor);
      
      // Generate hover shade (darken by 10%)
      const hoverColor = darkenColor(config.primaryColor, 0.1);
      root.style.setProperty('--color-button-hover', hoverColor);
    }
  }
}

/**
 * Darken a hex color by a percentage.
 * @param hex - Hex color string (e.g., "#6366f1")
 * @param amount - Amount to darken (0-1)
 * @returns Darkened hex color
 */
function darkenColor(hex: string, amount: number): string {
  const color = hex.replace('#', '');
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - amount)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00FF) * (1 - amount)));
  const b = Math.max(0, Math.floor((num & 0x0000FF) * (1 - amount)));
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
}
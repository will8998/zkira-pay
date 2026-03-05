'use client';

import { useAdminAuth } from '@/components/admin/AdminAuthGate';

export default function SettingsPage() {
  const { isMaster } = useAdminAuth();

  // Access denied for non-master users
  if (!isMaster) {
    return (
      <div className="p-4 md:p-6">
        <div className="bg-[var(--color-surface)] border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-[var(--color-text)] mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728" />
            </svg>
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text)]">Access Denied</h3>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                This page is only accessible to master administrators.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text)]">Settings</h1>
        <p className="text-[var(--color-muted)]">Platform configuration and management (Master only)</p>
      </div>

      {/* Platform Info */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Platform Information</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-text)]">Version</span>
            <span className="text-sm text-[var(--color-muted)]">v1.0.0</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-text)]">Environment</span>
            <span className="text-sm text-[var(--color-muted)]">Production</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
            <span className="text-sm font-medium text-[var(--color-text)]">Deployment</span>
            <span className="text-sm text-[var(--color-muted)]">OMNIPAY Multi-tenant</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-sm font-medium text-[var(--color-text)]">Last Updated</span>
            <span className="text-sm text-[var(--color-muted)]">{new Date().toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Configuration Management */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">Configuration Management</h3>
        <div className="text-center py-8">
          <div className="mb-4">
            <svg className="w-12 h-12 text-[var(--color-muted)] mx-auto" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h4 className="text-lg font-medium text-[var(--color-text)] mb-2">Coming Soon</h4>
          <p className="text-sm text-[var(--color-muted)] max-w-md mx-auto">
            Advanced configuration management features will be available in a future update. 
            This will include platform settings, fee configurations, and system parameters.
          </p>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-[var(--color-surface)] rounded-none border-1.5 border-[var(--border-subtle)] p-4 md:p-6">
        <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 border border-[var(--color-border)] rounded-none">
            <div className="w-3 h-3 bg-[var(--color-green)] rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-[var(--color-text)]">API Server</p>
            <p className="text-xs text-[var(--color-muted)]">Online</p>
          </div>
          <div className="text-center p-4 border border-[var(--color-border)] rounded-none">
            <div className="w-3 h-3 bg-[var(--color-green)] rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-[var(--color-text)]">Database</p>
            <p className="text-xs text-[var(--color-muted)]">Connected</p>
          </div>
          <div className="text-center p-4 border border-[var(--color-border)] rounded-none">
            <div className="w-3 h-3 bg-[var(--color-green)] rounded-full mx-auto mb-2"></div>
            <p className="text-sm font-medium text-[var(--color-text)]">Blockchain</p>
            <p className="text-xs text-[var(--color-muted)]">Synced</p>
          </div>
        </div>
      </div>
    </div>
  );
}
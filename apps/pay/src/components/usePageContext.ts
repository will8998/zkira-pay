'use client';

import { usePathname } from 'next/navigation';

interface PageContext {
  title: string;
  section: string | null;
  breadcrumbs: { label: string; href: string | null }[];
}

const ROUTE_MAP: Record<string, { title: string; section: string | null }> = {
  '/': { title: 'Dashboard', section: null },
  '/create': { title: 'Send', section: 'Payments' },
  '/request': { title: 'Request', section: 'Payments' },
  '/batch': { title: 'Batch', section: 'Payments' },
  '/escrow': { title: 'Escrow', section: 'Finance' },
  '/escrow/create': { title: 'Create Escrow', section: 'Finance' },
  '/multisig': { title: 'Multi-sig', section: 'Finance' },
  '/multisig/create': { title: 'Create Multi-sig', section: 'Finance' },
  '/history': { title: 'History', section: 'Activity' },
  '/contacts': { title: 'Contacts', section: 'Activity' },
  '/developers': { title: 'API Keys', section: 'Developers' },
  '/developers/docs': { title: 'Documentation', section: 'Developers' },
};

export function usePageContext(): PageContext {
  const pathname = usePathname();

  // Exact match first
  const exact = ROUTE_MAP[pathname];
  if (exact) {
    const breadcrumbs: { label: string; href: string | null }[] = [];
    if (exact.section) {
      breadcrumbs.push({ label: exact.section, href: null });
    }
    breadcrumbs.push({ label: exact.title, href: pathname });
    return { title: exact.title, section: exact.section, breadcrumbs };
  }

  // Dynamic route matching
  if (pathname.startsWith('/escrow/')) {
    return {
      title: 'Escrow Details',
      section: 'Finance',
      breadcrumbs: [
        { label: 'Finance', href: null },
        { label: 'Escrow', href: '/escrow' },
        { label: 'Details', href: pathname },
      ],
    };
  }

  if (pathname.startsWith('/claim')) {
    return {
      title: 'Claim Payment',
      section: null,
      breadcrumbs: [{ label: 'Claim Payment', href: pathname }],
    };
  }

  if (pathname.startsWith('/pay')) {
    return {
      title: 'Pay Invoice',
      section: null,
      breadcrumbs: [{ label: 'Pay Invoice', href: pathname }],
    };
  }

  // Fallback
  return {
    title: 'OMNIPAY',
    section: null,
    breadcrumbs: [{ label: 'OMNIPAY', href: '/' }],
  };
}

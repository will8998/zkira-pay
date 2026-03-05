'use client';

import { SendPaymentWizard } from '@/components/SendPaymentWizard';

export default function CreatePage() {
  return (
    <div className="px-4 md:px-6 py-6 md:py-10">
      <SendPaymentWizard />
    </div>
  );
}

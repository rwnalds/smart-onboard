'use client';

import { use } from 'react';
import Link from 'next/link';

export default function PublicOnboardingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-6xl mb-4">📋</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Onboarding System Deprecated</h1>
        <p className="text-gray-600 mb-6">
          The public onboarding form feature has been replaced with our new client-centric system.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Looking for: <code className="bg-gray-100 px-2 py-1 rounded">/onboard/{slug}</code>
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}

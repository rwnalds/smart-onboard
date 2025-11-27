'use client';

import { use, useState, useEffect } from 'react';
import OnboardingFlow from '@/components/OnboardingFlow';
import { AgencyConfig } from '@/types';
import { getAgencyConfigBySlug } from '@/app/actions';

export default function PublicOnboardingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [config, setConfig] = useState<AgencyConfig | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getAgencyConfigBySlug(slug);
        if (data) {
          setConfig(data.config);
          setUserId(data.userId);
        } else {
          setError('Onboarding form not found');
        }
      } catch (err) {
        console.error('Failed to load config:', err);
        setError('Failed to load onboarding form');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading onboarding form...</p>
        </div>
      </div>
    );
  }

  if (error || !config || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600">{error || 'This onboarding form does not exist or has been removed.'}</p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingFlow
      config={config}
      mode="client"
      userId={userId}
    />
  );
}

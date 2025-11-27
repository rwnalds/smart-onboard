'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import AdminDashboard from '@/components/AdminDashboard';
import OnboardingFlow from '@/components/OnboardingFlow';
import { AgencyConfig } from '@/types';
import { getAgencyConfig, saveAgencyConfig as dbSaveAgencyConfig, upsertUser } from './actions';

// Default configuration based on a typical Marketing/AI agency
const DEFAULT_CONFIG: AgencyConfig = {
  name: "NexGen Marketing",
  industry: "Digital Marketing & Automation",
  description: "We help e-commerce brands scale using paid ads (FB/Google) and email marketing automation.",
  onboardingGoal: "Understand their current revenue, target audience demographics, main competitors, and advertising budget.",
  tone: "Professional & Formal",
  targetAudience: "E-commerce store owners making $10k+ monthly revenue",
  maxQuestions: 8,
  theme: {
    primaryColor: "#4f46e5", // Indigo-600
    backgroundColor: "#ffffff",
    textColor: "#111827", // Gray-900
  }
};

export default function Home() {
  const stackUser = useUser();
  const [config, setConfig] = useState<AgencyConfig>(DEFAULT_CONFIG);
  const [view, setView] = useState<'admin' | 'preview' | 'client'>('admin');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load user config from database
    const loadUserData = async () => {
      if (stackUser) {
        try {
          // Upsert user in database
          await upsertUser({
            id: stackUser.id,
            email: stackUser.primaryEmail || '',
            name: stackUser.displayName || undefined,
            avatar: stackUser.profileImageUrl || undefined,
          });

          // Load agency config
          const savedConfig = await getAgencyConfig(stackUser.id);
          if (savedConfig) {
            setConfig(savedConfig);
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
      setIsLoading(false);
    };

    loadUserData();
  }, [stackUser]);

  useEffect(() => {
    // Hash routing for client view takes precedence
    const handleHashChange = () => {
      if (window.location.hash === '#client') {
        setView('client');
      } else if (window.location.hash === '#preview') {
        setView('preview');
      } else {
        setView('admin');
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSaveConfig = async (newConfig: AgencyConfig) => {
    setConfig(newConfig);
    if (stackUser) {
      try {
        await dbSaveAgencyConfig(stackUser.id, newConfig);
      } catch (error) {
        console.error('Failed to save config:', error);
      }
    }
  };

  const handleLogout = async () => {
    await stackUser?.signOut();
  };

  // Show loading or redirect to sign-in if not authenticated
  if (!stackUser) {
    if (typeof window !== 'undefined') {
      window.location.href = '/handler/sign-in';
    }
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (view === 'client') {
    return (
      <OnboardingFlow
        config={config}
        mode="client"
        userId={stackUser.id}
      />
    );
  }

  if (view === 'preview') {
    return (
      <OnboardingFlow
        config={config}
        mode="preview"
        onExit={() => setView('admin')}
        userId={stackUser.id}
      />
    );
  }

  return (
    <AdminDashboard
      user={{
        id: stackUser.id,
        name: stackUser.displayName || 'User',
        email: stackUser.primaryEmail || '',
        avatar: stackUser.profileImageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
      }}
      config={config}
      onSave={handleSaveConfig}
      onStart={() => setView('preview')}
      onLogout={handleLogout}
    />
  );
}

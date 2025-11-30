'use client';

import { useEffect } from 'react';
import { useUser } from '@stackframe/stack';
import { useRouter } from 'next/navigation';
import { upsertUser } from './actions';

export default function Home() {
  const stackUser = useUser();
  const router = useRouter();

  useEffect(() => {
    const initializeAndRedirect = async () => {
      // Redirect to sign-in if not authenticated
      if (!stackUser) {
        router.push('/handler/sign-in');
        return;
      }

      // Upsert user in database
      try {
        await upsertUser({
          id: stackUser.id,
          email: stackUser.primaryEmail || '',
          name: stackUser.displayName || undefined,
          avatar: stackUser.profileImageUrl || undefined,
        });
      } catch (error) {
        console.error('Failed to upsert user:', error);
      }

      // Redirect to clients page
      router.push('/clients');
    };

    void initializeAndRedirect();
  }, [stackUser, router]);

  // Show loading state while redirecting
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

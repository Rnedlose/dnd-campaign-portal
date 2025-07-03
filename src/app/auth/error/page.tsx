'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Authentication Error</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {error === 'AccessDenied'
              ? 'You do not have permission to access this resource.'
              : 'An error occurred during authentication.'}
          </p>
        </div>
        <div className="mt-6">
          <a
            href="/auth/signin"
            className="flex w-full justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Return to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}

'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { useEffect } from 'react';
import { useTheme } from 'next-themes';

function useUserThemeSync() {
  const { data: session, status } = useSession();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      fetch('/api/user/theme')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.theme) {
            setTheme(data.theme);
          }
        })
        .catch(() => {});
    }
  }, [status, session?.user, setTheme]);
}

function UserThemeSyncWrapper({ children }: { children: React.ReactNode }) {
  useUserThemeSync();
  return <>{children}</>;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserThemeSyncWrapper>{children}</UserThemeSyncWrapper>
    </SessionProvider>
  );
}

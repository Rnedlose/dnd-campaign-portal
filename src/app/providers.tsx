'use client';

import { ThemeProvider } from 'next-themes';
import { NextSSRPlugin } from '@uploadthing/react/next-ssr-plugin';
import { extractRouterConfig } from 'uploadthing/server';
import { ourFileRouter } from '@/app/api/uploadthing/core';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
      {children}
    </ThemeProvider>
  );
}

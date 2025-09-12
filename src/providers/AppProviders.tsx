// src/providers/AppProviders.tsx
'use client';

import { BootProvider } from '@/providers/BootProvider';
import { LenisProvider } from '@/providers/LenisProvider';
import { RouteTransitionsProvider } from '@/providers/RouteTransitionsProvider';
import { AppEventsProvider } from '@/providers/AppEventsProvider';
import { OGLRoot } from '@/webgl/providers/OGLRoot';

export function AppProviders(props: { children: React.ReactNode }) {
  return (
    <>
      <BootProvider>
        <LenisProvider>
          <AppEventsProvider>
            <RouteTransitionsProvider>{props.children}</RouteTransitionsProvider>
            </AppEventsProvider>
        </LenisProvider>
      </BootProvider>
      <OGLRoot />
    </>
  );
}
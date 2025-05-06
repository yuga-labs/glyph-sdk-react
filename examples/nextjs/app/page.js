'use client';

import { GlyphProvider, GlyphWidget } from '@use-glyph/sdk-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">Next.js with Glyph Widget</h1>
      
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <GlyphProvider>
          <GlyphWidget theme="light" />
        </GlyphProvider>
      </div>
    </main>
  );
}

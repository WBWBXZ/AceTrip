'use client';

import dynamic from 'next/dynamic';

const GlobeWidget = dynamic(() => import('./GlobeWidget'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-48 h-48 rounded-full bg-[#e8f5ea] border border-[#2D6A4F]/20 animate-pulse" />
    </div>
  ),
});

export default function GlobeLoader() {
  return <div className="w-full h-full"><GlobeWidget /></div>;
}

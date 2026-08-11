'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, MapPin, Heart, Compass } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: Compass },
  { href: '/tournaments', label: '赛事', icon: Trophy },
  { href: '/players', label: '球员', icon: Users },
  { href: '/follow', label: '关注', icon: MapPin },
  { href: '/bucket-list', label: '心愿', icon: Heart },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-strong border-t border-black/5">
      <div className="flex min-h-16 items-center justify-around px-2 pb-[max(env(safe-area-inset-bottom),0.25rem)] pt-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 min-w-11 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-1.5 transition-all ${
                active
                  ? 'text-[var(--tennis-green)]'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

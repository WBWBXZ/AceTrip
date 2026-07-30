'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Trophy, Users, MapPin, Heart, Compass, User, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

const NAV_ITEMS = [
  { href: '/', label: '首页', icon: Compass },
  { href: '/tournaments', label: '赛事', icon: Trophy },
  { href: '/players', label: '球员', icon: Users },
  { href: '/follow', label: '关注', icon: MapPin },
  { href: '/bucket-list', label: '心愿单', icon: Heart },
];

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  return (
    <>
    <header className="sticky top-0 z-50 glass-strong">
      <div className="container-tight flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: 'var(--tennis-green)' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M2.5 7.5 C5 5, 8 4, 10 10 C12 16, 15 15, 17.5 12.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M2.5 12.5 C5 15, 8 16, 10 10 C12 4, 15 5, 17.5 7.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="hidden sm:block text-[15px] font-semibold tracking-tight">
            AceTrip
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'text-[var(--tennis-green)] bg-[var(--tennis-green)]/8'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-black/4'
                }`}
              >
                <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* 登录/用户 */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
                {user.email?.replace('@acetrip.app', '')}
              </span>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="p-1.5 rounded-lg transition-colors hover:bg-black/5"
                title="退出登录"
              >
                <LogOut size={16} style={{ color: 'var(--text-secondary)' }} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-black/5"
              style={{ color: 'var(--tennis-green)' }}
            >
              <User size={15} />
              <span className="hidden sm:block">登录</span>
            </Link>
          )}
        </div>
      </div>
    </header>

      {/* 退出登录确认弹窗 */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl p-6 mx-4 max-w-xs w-full shadow-xl text-center">
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>确认退出登录？</p>
            <p className="text-xs mb-5" style={{ color: 'var(--text-secondary)' }}>退出后需要重新登录才能使用关注和心愿单功能</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ background: 'rgba(0,0,0,0.05)', color: 'var(--text-secondary)' }}
              >
                取消
              </button>
              <button
                onClick={() => { setShowLogoutConfirm(false); signOut(); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors"
                style={{ background: '#ef4444' }}
              >
                确认退出
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

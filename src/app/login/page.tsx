'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { signIn, signUp, user } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // 已登录，跳转首页
  if (user) {
    router.push('/');
    return null;
  }

  const validatePhone = (p: string) => /^1[3-9]\d{9}$/.test(p);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validatePhone(phone)) {
      setError('请输入有效的11位手机号');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6位');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      setError('两次密码不一致');
      return;
    }

    setLoading(true);
    if (isRegister) {
      const { error: err } = await signUp(phone, password);
      if (err) {
        setError(err);
      } else {
        setSuccess('注册成功！');
        // 自动登录
        await signIn(phone, password);
        router.push('/');
      }
    } else {
      const { error: err } = await signIn(phone, password);
      if (err) {
        setError(err);
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--warm-cream)' }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--tennis-green)' }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="white" strokeWidth="1.5" fill="none"/>
              <path d="M6 8 Q14 18 22 8" stroke="white" strokeWidth="1.2" fill="none"/>
              <path d="M6 20 Q14 10 22 20" stroke="white" strokeWidth="1.2" fill="none"/>
            </svg>
          </div>
          <h1
            className="text-2xl font-semibold tracking-tight"
            style={{ fontFamily: 'var(--font-serif)', color: 'var(--tennis-green-dark)' }}
          >
            AceTrip
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {isRegister ? '创建账号，开始你的网球之旅' : '登录你的账号'}
          </p>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              手机号
            </label>
            <input
              type="tel"
              maxLength={11}
              placeholder="请输入手机号"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                background: 'white',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--tennis-green)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
              密码
            </label>
            <input
              type="password"
              placeholder="请输入密码（至少6位）"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
              style={{
                borderColor: 'rgba(0,0,0,0.1)',
                background: 'white',
                color: 'var(--text-primary)',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--tennis-green)'}
              onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
            />
          </div>

          {isRegister && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                确认密码
              </label>
              <input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{
                  borderColor: 'rgba(0,0,0,0.1)',
                  background: 'white',
                  color: 'var(--text-primary)',
                }}
                onFocus={e => e.target.style.borderColor = 'var(--tennis-green)'}
                onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.1)'}
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">{success}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg text-sm font-medium text-white transition-all"
            style={{
              background: loading ? '#999' : 'var(--tennis-green)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '请稍候...' : isRegister ? '注册' : '登录'}
          </button>
        </form>

        {/* 切换登录/注册 */}
        <div className="text-center mt-5">
          <button
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            className="text-xs transition-colors"
            style={{ color: 'var(--tennis-green)' }}
          >
            {isRegister ? '已有账号？去登录' : '没有账号？去注册'}
          </button>
        </div>

        {/* 底部说明 */}
        <p className="text-center text-[10px] mt-8" style={{ color: 'var(--text-muted)' }}>
          手机号仅作为登录标识，不会发送短信验证
        </p>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquarePlus, X, Send } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function FeedbackButton() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim() || !user) return;
    setSending(true);
    const phone = user.email?.replace('@acetrip.app', '') || '';
    await supabase.from('feedback').insert({
      user_id: user.id,
      phone,
      message: message.trim(),
    });
    setSending(false);
    setSent(true);
    setMessage('');
    setTimeout(() => { setSent(false); setOpen(false); }, 1500);
  };

  const router = useRouter();

  const handleClick = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    setOpen(true);
  };

  return (
    <>
      {/* 悬浮按钮 */}
      <button
        onClick={handleClick}
        className="fixed bottom-24 right-4 z-50 w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'var(--tennis-green)', color: 'white' }}
        title="意见反馈"
      >
        <MessageSquarePlus size={20} />
      </button>

      {/* 反馈弹窗 */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-t-2xl sm:rounded-2xl p-5 mx-0 sm:mx-4 w-full sm:max-w-sm shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                💌 意见信箱
              </h3>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-black/5">
                <X size={16} style={{ color: 'var(--text-muted)' }} />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-8">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>感谢你的反馈！</p>
              </div>
            ) : (
              <>
                <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
                  有任何建议、bug 反馈或想说的话，都可以写在这里
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="写下你的想法..."
                  className="w-full h-28 p-3 rounded-xl text-sm resize-none outline-none transition-colors"
                  style={{
                    background: 'rgba(0,0,0,0.03)',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(0,0,0,0.06)',
                  }}
                  maxLength={500}
                />
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    {message.length}/500
                  </span>
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim() || sending}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-40"
                    style={{ background: 'var(--tennis-green)' }}
                  >
                    {sending ? '提交中...' : <><Send size={14} /> 提交</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

'use client';

import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { useAppStore } from '@/lib/store';

interface FollowState {
  confirmType: 'follow' | 'unfollow' | null;
  celebrateVisible: boolean;
  followCount: number;
  targetId: string;
  targetName: string;
}

export function useFollowConfirm() {
  const { followPlayer, unfollowPlayer, isFollowing, followedPlayers } = useAppStore();
  const [state, setState] = useState<FollowState>({
    confirmType: null,
    celebrateVisible: false,
    followCount: 0,
    targetId: '',
    targetName: '',
  });

  const requestFollow = useCallback((playerId: string, playerName: string) => {
    const following = isFollowing(playerId);
    setState({
      confirmType: following ? 'unfollow' : 'follow',
      celebrateVisible: false,
      followCount: 0,
      targetId: playerId,
      targetName: playerName,
    });
  }, [isFollowing]);

  const confirmFollow = useCallback(() => {
    followPlayer(state.targetId);
    const count = followedPlayers.length + 1;
    setState(prev => ({
      ...prev,
      confirmType: null,
      celebrateVisible: true,
      followCount: count,
    }));
    setTimeout(() => setState(prev => ({ ...prev, celebrateVisible: false })), 3000);
  }, [followPlayer, followedPlayers.length, state.targetId]);

  const confirmUnfollow = useCallback(() => {
    unfollowPlayer(state.targetId);
    setState(prev => ({ ...prev, confirmType: null }));
  }, [unfollowPlayer, state.targetId]);

  const dismiss = useCallback(() => {
    setState(prev => ({ ...prev, confirmType: null, celebrateVisible: false }));
  }, []);

  return { state, requestFollow, confirmFollow, confirmUnfollow, dismiss };
}

interface FollowDialogsProps {
  state: FollowState;
  confirmFollow: () => void;
  confirmUnfollow: () => void;
  dismiss: () => void;
}

export function FollowDialogs({ state, confirmFollow, confirmUnfollow, dismiss }: FollowDialogsProps) {
  return (
    <>
      {/* 关注确认弹窗 */}
      {state.confirmType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
          onClick={dismiss}
        >
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl" onClick={e => e.stopPropagation()}>
            {state.confirmType === 'follow' ? (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                  <Heart size={28} className="text-rose-500" />
                </div>
                <h3 className="font-noto-serif text-lg font-bold text-gray-900 mb-2">关注 {state.targetName}</h3>
                <p className="text-sm text-gray-500 mb-6">将追踪她的赛季征程和比赛动态</p>
                <div className="flex gap-3">
                  <button onClick={dismiss} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">取消</button>
                  <button onClick={confirmFollow} className="flex-1 py-2.5 rounded-xl bg-rose-500 text-white text-sm font-medium hover:bg-rose-600 transition-colors">❤️ 关注</button>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Heart size={28} className="text-gray-400" />
                </div>
                <h3 className="font-noto-serif text-lg font-bold text-gray-900 mb-2">取消关注</h3>
                <p className="text-sm text-gray-500 mb-6">确定不再关注 {state.targetName} 吗？</p>
                <div className="flex gap-3">
                  <button onClick={dismiss} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition-colors">再想想</button>
                  <button onClick={confirmUnfollow} className="flex-1 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-medium hover:bg-gray-900 transition-colors">取消关注</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 关注成功庆祝 */}
      {state.celebrateVisible && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(6px)' }}
          onClick={dismiss}
        >
          <div className="bg-white rounded-2xl p-8 max-w-xs w-full mx-4 text-center shadow-2xl animate-bounce-in" onClick={e => e.stopPropagation()}>
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="font-noto-serif text-xl font-bold text-gray-900 mb-2">关注成功</h3>
            <p className="text-base font-medium text-rose-500 mb-1">{state.targetName}</p>
            <p className="text-sm text-gray-400">这是你关注的第 {state.followCount} 位球员</p>
          </div>
        </div>
      )}
    </>
  );
}

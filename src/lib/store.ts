// ============================================================
// Zustand store — client-side state (bucket list, follows)
// Syncs with Supabase when user is logged in
// ============================================================

'use client';

import { create } from 'zustand';
import type { BucketListItem, FollowedPlayer, ZineWork } from '@/types';
import { supabase } from '@/lib/supabase';

interface AppState {
  // Auth state
  userId: string | null;
  setUserId: (id: string | null) => void;

  // Bucket List
  bucketList: BucketListItem[];
  addToBucketList: (tournamentId: string) => void;
  removeFromBucketList: (tournamentId: string) => void;
  toggleBucketItem: (tournamentId: string) => void;
  isBucketListed: (tournamentId: string) => boolean;
  updateBucketDiary: (tournamentId: string, diary: string) => void;
  updateBucketRating: (tournamentId: string, rating: number) => void;

  // Followed Players
  followedPlayers: FollowedPlayer[];
  followPlayer: (playerId: string) => void;
  unfollowPlayer: (playerId: string) => void;
  reorderFollowedPlayers: (playerIds: string[]) => void;
  isFollowing: (playerId: string) => boolean;

  // Zines / 手账
  zines: ZineWork[];
  addZine: (zine: ZineWork) => void;
  updateZine: (zine: ZineWork) => void;
  removeZine: (id: string) => void;

  // Load from Supabase
  loadFromSupabase: (userId: string) => Promise<void>;
  clearData: () => void;
}

export const useAppStore = create<AppState>()(
  (set, get) => ({
    // ---- Auth ----
    userId: null,
    setUserId: (id) => set({ userId: id }),

    // ---- Bucket List ----
    bucketList: [],
    addToBucketList: async (tournamentId) => {
      const userId = get().userId;
      const newItem: BucketListItem = {
        tournamentId,
        addedAt: new Date().toISOString(),
        completed: false,
      };
      set((state) => ({ bucketList: [...state.bucketList, newItem] }));
      if (userId) {
        const { error } = await supabase
          .from('user_wishlist')
          .insert({ user_id: userId, tournament_id: tournamentId });
        if (error && get().userId === userId) {
          set((state) => ({
            bucketList: state.bucketList.filter((item) => item !== newItem),
          }));
        }
      }
    },
    removeFromBucketList: async (tournamentId) => {
      const userId = get().userId;
      const previousItems = get().bucketList;
      const removedIndex = previousItems.findIndex((item) => item.tournamentId === tournamentId);
      const removedItem = previousItems[removedIndex];
      set((state) => ({
        bucketList: state.bucketList.filter((item) => item.tournamentId !== tournamentId),
      }));
      if (userId) {
        const { error } = await supabase
          .from('user_wishlist')
          .delete()
          .eq('user_id', userId)
          .eq('tournament_id', tournamentId);
        if (error && removedItem && get().userId === userId) {
          set((state) => {
            if (state.bucketList.some((item) => item.tournamentId === tournamentId)) {
              return state;
            }
            const bucketList = [...state.bucketList];
            bucketList.splice(Math.min(removedIndex, bucketList.length), 0, removedItem);
            return { bucketList };
          });
        }
      }
    },
    toggleBucketItem: (tournamentId) =>
      set((state) => ({
        bucketList: state.bucketList.map((b) =>
          b.tournamentId === tournamentId ? { ...b, completed: !b.completed } : b
        ),
      })),
    isBucketListed: (tournamentId) =>
      get().bucketList.some((b) => b.tournamentId === tournamentId),
    updateBucketDiary: (tournamentId, diary) =>
      set((state) => ({
        bucketList: state.bucketList.map((b) =>
          b.tournamentId === tournamentId
            ? { ...b, diary, diaryDate: new Date().toISOString() }
            : b
        ),
      })),
    updateBucketRating: (tournamentId, rating) =>
      set((state) => ({
        bucketList: state.bucketList.map((b) =>
          b.tournamentId === tournamentId ? { ...b, rating } : b
        ),
      })),

    // ---- Followed Players ----
    followedPlayers: [],
    followPlayer: async (playerId) => {
      const userId = get().userId;
      const newItem: FollowedPlayer = {
        playerId,
        followedAt: new Date().toISOString(),
      };
      set((state) => ({ followedPlayers: [...state.followedPlayers, newItem] }));
      if (userId) {
        const { error } = await supabase
          .from('user_follows')
          .insert({ user_id: userId, player_id: playerId });
        if (error && get().userId === userId) {
          set((state) => ({
            followedPlayers: state.followedPlayers.filter((item) => item !== newItem),
          }));
        }
      }
    },
    unfollowPlayer: async (playerId) => {
      const userId = get().userId;
      const previousItems = get().followedPlayers;
      const removedIndex = previousItems.findIndex((item) => item.playerId === playerId);
      const removedItem = previousItems[removedIndex];
      set((state) => ({
        followedPlayers: state.followedPlayers.filter((item) => item.playerId !== playerId),
      }));
      if (userId) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('user_id', userId)
          .eq('player_id', playerId);
        if (error && removedItem && get().userId === userId) {
          set((state) => {
            if (state.followedPlayers.some((item) => item.playerId === playerId)) {
              return state;
            }
            const followedPlayers = [...state.followedPlayers];
            followedPlayers.splice(Math.min(removedIndex, followedPlayers.length), 0, removedItem);
            return { followedPlayers };
          });
        }
      }
    },
    reorderFollowedPlayers: (playerIds) =>
      set((state) => {
        const ordered = playerIds
          .map(id => state.followedPlayers.find(f => f.playerId === id))
          .filter(Boolean) as FollowedPlayer[];
        return { followedPlayers: ordered };
      }),
    isFollowing: (playerId) =>
      get().followedPlayers.some((f) => f.playerId === playerId),

    // ---- Zines ----
    zines: [],
    addZine: (zine) =>
      set((state) => ({ zines: [zine, ...state.zines] })),
    updateZine: (zine) =>
      set((state) => ({
        zines: state.zines.map((z) => (z.id === zine.id ? zine : z)),
      })),
    removeZine: (id) =>
      set((state) => ({ zines: state.zines.filter((z) => z.id !== id) })),

    // ---- Supabase Sync ----
    loadFromSupabase: async (userId: string) => {
      const [followsRes, wishlistRes] = await Promise.all([
        supabase.from('user_follows').select('player_id, created_at').eq('user_id', userId),
        supabase.from('user_wishlist').select('tournament_id, created_at').eq('user_id', userId),
      ]);

      const followedPlayers: FollowedPlayer[] = (followsRes.data || []).map((r: { player_id: string; created_at: string }) => ({
        playerId: r.player_id,
        followedAt: r.created_at,
      }));

      const bucketList: BucketListItem[] = (wishlistRes.data || []).map((r: { tournament_id: string; created_at: string }) => ({
        tournamentId: r.tournament_id,
        addedAt: r.created_at,
        completed: false,
      }));

      set({ userId, followedPlayers, bucketList });
    },

    clearData: () => set({ userId: null, followedPlayers: [], bucketList: [], zines: [] }),
  })
);

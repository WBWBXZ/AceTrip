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
  toggleBucketItem: (tournamentId: string) => Promise<void>;
  isBucketListed: (tournamentId: string) => boolean;
  updateBucketDiary: (tournamentId: string, diary: string) => Promise<void>;
  updateBucketRating: (tournamentId: string, rating: number) => Promise<void>;

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
          .from('tournament_wishlists')
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
          .from('tournament_wishlists')
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
    toggleBucketItem: async (tournamentId) => {
      const userId = get().userId;
      const previousItem = get().bucketList.find((item) => item.tournamentId === tournamentId);
      if (!previousItem) return;

      const completed = !previousItem.completed;
      set((state) => ({
        bucketList: state.bucketList.map((item) =>
          item.tournamentId === tournamentId ? { ...item, completed } : item
        ),
      }));

      if (userId) {
        const { error } = await supabase
          .from('tournament_wishlists')
          .update({ completed })
          .eq('user_id', userId)
          .eq('tournament_id', tournamentId);
        if (error && get().userId === userId) {
          set((state) => ({
            bucketList: state.bucketList.map((item) =>
              item.tournamentId === tournamentId && item.completed === completed
                ? { ...item, completed: previousItem.completed }
                : item
            ),
          }));
        }
      }
    },
    isBucketListed: (tournamentId) =>
      get().bucketList.some((b) => b.tournamentId === tournamentId),
    updateBucketDiary: async (tournamentId, diary) => {
      const userId = get().userId;
      const previousItem = get().bucketList.find((item) => item.tournamentId === tournamentId);
      if (!previousItem) return;

      const diaryDate = new Date().toISOString().slice(0, 10);
      set((state) => ({
        bucketList: state.bucketList.map((item) =>
          item.tournamentId === tournamentId ? { ...item, diary, diaryDate } : item
        ),
      }));

      if (userId) {
        const { error } = await supabase
          .from('tournament_wishlists')
          .update({ diary, diary_date: diaryDate })
          .eq('user_id', userId)
          .eq('tournament_id', tournamentId);
        if (error && get().userId === userId) {
          set((state) => ({
            bucketList: state.bucketList.map((item) =>
              item.tournamentId === tournamentId && item.diary === diary && item.diaryDate === diaryDate
                ? { ...item, diary: previousItem.diary, diaryDate: previousItem.diaryDate }
                : item
            ),
          }));
        }
      }
    },
    updateBucketRating: async (tournamentId, rating) => {
      const userId = get().userId;
      const previousItem = get().bucketList.find((item) => item.tournamentId === tournamentId);
      if (!previousItem) return;

      set((state) => ({
        bucketList: state.bucketList.map((item) =>
          item.tournamentId === tournamentId ? { ...item, rating } : item
        ),
      }));

      if (userId) {
        const { error } = await supabase
          .from('tournament_wishlists')
          .update({ rating })
          .eq('user_id', userId)
          .eq('tournament_id', tournamentId);
        if (error && get().userId === userId) {
          set((state) => ({
            bucketList: state.bucketList.map((item) =>
              item.tournamentId === tournamentId && item.rating === rating
                ? { ...item, rating: previousItem.rating }
                : item
            ),
          }));
        }
      }
    },

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
        supabase
          .from('tournament_wishlists')
          .select('tournament_id, created_at, completed, diary, diary_date, rating')
          .eq('user_id', userId),
      ]);

      const followedPlayers: FollowedPlayer[] = (followsRes.data || []).map((r: { player_id: string; created_at: string }) => ({
        playerId: r.player_id,
        followedAt: r.created_at,
      }));

      const bucketList: BucketListItem[] = (wishlistRes.data || []).map((r: {
        tournament_id: string;
        created_at: string;
        completed: boolean | null;
        diary: string | null;
        diary_date: string | null;
        rating: number | null;
      }) => ({
        tournamentId: r.tournament_id,
        addedAt: r.created_at,
        completed: r.completed ?? false,
        diary: r.diary ?? undefined,
        diaryDate: r.diary_date ?? undefined,
        rating: r.rating ?? undefined,
      }));

      set({ userId, followedPlayers, bucketList });
    },

    clearData: () => set({ userId: null, followedPlayers: [], bucketList: [], zines: [] }),
  })
);

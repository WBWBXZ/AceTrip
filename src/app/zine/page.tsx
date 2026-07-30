'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Clock, PenLine } from 'lucide-react';
import { ZineEditor, ZINE_TEMPLATES } from '@/components/zine/ZineEditor';
import { useAppStore } from '@/lib/store';
import type { ZineWork } from '@/types';

// ─── Template definitions (same list as in ZineEditor, just metadata) ──────

const TEMPLATE_PREVIEWS = [
  {
    id: 'fan-card',
    name: '球员应援卡',
    emoji: '👑',
    desc: '球员大图 + 应援文字',
    bg: '#2D6A4F',
    textColor: '#fff',
  },
  {
    id: 'match-diary',
    name: '赛事打卡日记',
    emoji: '🏟️',
    desc: '赛事 + 城市 + 日记',
    bg: '#F5F0E8',
    textColor: '#2D6A4F',
  },
  {
    id: 'best-moments',
    name: '赛季最佳时刻',
    emoji: '🌟',
    desc: '2026 Best Moments',
    bg: '#1a1a1a',
    textColor: '#ffd700',
  },
  {
    id: 'travel-diary',
    name: '旅行日记',
    emoji: '✈️',
    desc: '城市 + 地图 + 日记',
    bg: 'linear-gradient(135deg, #f8e8f0 0%, #ffe4d6 100%)',
    textColor: '#2D6A4F',
  },
  {
    id: 'blank',
    name: '空白画布',
    emoji: '🎨',
    desc: '完全自由创作',
    bg: '#fff',
    textColor: '#333',
  },
];

// ─── ZineThumbnail ────────────────────────────────────────────────────────────

function ZineThumbnail({ work, onOpen, onDelete }: {
  work: ZineWork;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const date = new Date(work.createdAt).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });

  return (
    <div className="group relative rounded-2xl overflow-hidden bg-[#f4f4f4] shadow-sm hover:shadow-md transition-all cursor-pointer aspect-[3/4]"
      onClick={onOpen}>
      {work.thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={work.thumbnail} alt={work.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#2D6A4F]/10 to-[#2D6A4F]/5">
          <BookOpen size={28} className="text-[#2D6A4F]/40" />
          <span className="text-xs text-[#2D6A4F]/50 font-medium">{work.title}</span>
        </div>
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
        <p className="text-white text-xs font-semibold truncate">{work.title}</p>
        <p className="text-white/70 text-[10px]">{date}</p>
      </div>
      {/* Delete button */}
      <button
        onClick={e => { e.stopPropagation(); onDelete(); }}
        className="absolute top-2 right-2 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 text-white"
      >
        <Trash2 size={12} />
      </button>
      {/* Edit badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/50 rounded-full px-2 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <PenLine size={10} className="text-white" />
        <span className="text-white text-[10px]">编辑</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZinePage() {
  const { zines, addZine, updateZine, removeZine } = useAppStore();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<ZineWork | undefined>(undefined);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | undefined>(undefined);

  const openNewEditor = (templateId?: string) => {
    setEditingWork(undefined);
    setSelectedTemplateId(templateId ?? 'blank');
    setEditorOpen(true);
  };

  const openEditEditor = (work: ZineWork) => {
    setEditingWork(work);
    setSelectedTemplateId(undefined);
    setEditorOpen(true);
  };

  const handleSave = (work: ZineWork) => {
    if (zines.find(z => z.id === work.id)) {
      updateZine(work);
    } else {
      addZine(work);
    }
    setEditorOpen(false);
  };

  const handleClose = () => setEditorOpen(false);

  return (
    <>
      {/* Editor overlay */}
      {editorOpen && (
        <ZineEditor
          initialTemplate={
            !editingWork && selectedTemplateId
              ? ZINE_TEMPLATES.find(t => t.id === selectedTemplateId)
              : undefined
          }
          existingWork={editingWork}
          onSave={handleSave}
          onClose={handleClose}
        />
      )}

      <div className="min-h-screen bg-white pb-24">
        {/* ── Hero ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #2D6A4F 0%, #1a472a 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #fff 0%, transparent 50%), radial-gradient(circle at 80% 20%, #ffd700 0%, transparent 50%)' }} />
          <div className="relative container-tight pt-10 pb-8">
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen size={20} className="text-white/70" />
                  <span className="text-white/70 text-sm font-medium tracking-wider uppercase">Zine</span>
                </div>
                <h1 className="font-serif text-4xl font-bold text-white mb-1 tracking-tight">手账</h1>
                <p className="text-white/70 text-sm font-serif italic">创作属于你的网球杂志</p>
              </div>
              <button
                onClick={() => openNewEditor()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-[#2D6A4F] font-semibold text-sm hover:bg-white/90 shadow-lg transition-all hover:scale-105 active:scale-100"
              >
                <Plus size={16} strokeWidth={2.5} />
                新建
              </button>
            </div>
          </div>
        </div>

        <div className="container-tight py-8 space-y-10">
          {/* ── Templates ───────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">选择模板</h2>
              <span className="text-xs text-[#888]">点击开始创作</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {TEMPLATE_PREVIEWS.map(tpl => (
                <button
                  key={tpl.id}
                  onClick={() => openNewEditor(tpl.id)}
                  className="flex-shrink-0 w-32 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 group"
                >
                  {/* Card visual */}
                  <div
                    className="h-44 flex flex-col items-center justify-center gap-2 relative"
                    style={
                      tpl.bg.startsWith('linear-gradient')
                        ? { backgroundImage: tpl.bg }
                        : { backgroundColor: tpl.bg }
                    }
                  >
                    <span className="text-4xl group-hover:scale-110 transition-transform">{tpl.emoji}</span>
                    <span className="text-xs font-semibold text-center px-2 leading-tight"
                      style={{ color: tpl.textColor }}>
                      {tpl.name}
                    </span>
                  </div>
                  {/* Desc bar */}
                  <div className="bg-[#f9f9f9] px-2 py-2">
                    <p className="text-[10px] text-[#888] text-center leading-tight">{tpl.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── My Zines ────────────────────────────────────────── */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-[#1a1a1a]">我的手账</h2>
              {zines.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-[#888]">
                  <Clock size={12} />
                  {zines.length} 件作品
                </div>
              )}
            </div>

            {zines.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-[#2D6A4F]/20 py-16 flex flex-col items-center justify-center gap-4 cursor-pointer hover:border-[#2D6A4F]/40 transition-colors group"
                onClick={() => openNewEditor()}>
                <div className="w-16 h-16 rounded-2xl bg-[#2D6A4F]/8 flex items-center justify-center group-hover:bg-[#2D6A4F]/12 transition-colors">
                  <BookOpen size={28} className="text-[#2D6A4F]/50" />
                </div>
                <div className="text-center">
                  <p className="text-[#555] font-medium text-sm">还没有手账</p>
                  <p className="text-[#aaa] text-xs mt-1">点击上方模板或按 "新建" 开始创作</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {/* New button card */}
                <button
                  onClick={() => openNewEditor()}
                  className="rounded-2xl border-2 border-dashed border-[#2D6A4F]/25 aspect-[3/4] flex flex-col items-center justify-center gap-2 hover:border-[#2D6A4F]/50 hover:bg-[#2D6A4F]/4 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center group-hover:bg-[#2D6A4F]/20 transition-colors">
                    <Plus size={20} className="text-[#2D6A4F]" strokeWidth={2} />
                  </div>
                  <span className="text-xs text-[#2D6A4F] font-medium">新建</span>
                </button>

                {zines.map(work => (
                  <ZineThumbnail
                    key={work.id}
                    work={work}
                    onOpen={() => openEditEditor(work)}
                    onDelete={() => removeZine(work.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── About ───────────────────────────────────────────── */}
          <section className="rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #2D6A4F08, #2D6A4F15)' }}>
            <div className="px-6 py-5 border border-[#2D6A4F]/10 rounded-3xl">
              <p className="font-serif text-base font-semibold text-[#2D6A4F] mb-2">✦ 关于手账</p>
              <p className="text-sm text-[#555] leading-relaxed">
                用手账记录你与网球的每一次相遇——应援你爱的球员、打卡心仪的赛场、留下跨越城市的旅行故事。
                每一页都是专属于你的网球宇宙。
              </p>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  X, Type, Smile, Image as ImageIcon, Palette, Download, Save,
  RotateCcw, Trash2, Bold, AlignLeft, AlignCenter, AlignRight,
  ChevronLeft, Layers
} from 'lucide-react';
import type { ZineElement, ZineWork } from '@/types';
import { getTopPlayers } from '@/lib/data';

// ─── Constants ───────────────────────────────────────────────

const CANVAS_W = 375;
const CANVAS_H = 500;

const BACKGROUNDS = [
  { id: 'white',    label: '白',     value: '#ffffff' },
  { id: 'green',    label: '绿',     value: '#2D6A4F' },
  { id: 'cream',    label: '米',     value: '#F5F0E8' },
  { id: 'dark',     label: '黑',     value: '#1a1a1a' },
  { id: 'gradient', label: '渐变',   value: 'linear-gradient(135deg, #2D6A4F 0%, #1a472a 100%)' },
  { id: 'gradient2',label: '粉渐变', value: 'linear-gradient(135deg, #f8e8f0 0%, #ffe4d6 100%)' },
];

const STICKERS = ['🎾','🏆','🥇','🥈','🥉','🏟️','✈️','🌍','🎖️','⭐','💪','🔥','❤️','👑','🌟','🎯','🎪','🌺','📸','🏅'];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48];

const TEXT_COLORS = [
  '#ffffff', '#000000', '#2D6A4F', '#f59e0b', '#ef4444',
  '#3b82f6', '#8b5cf6', '#f97316', '#ec4899', '#6b7280',
];

// ─── Template Definitions ────────────────────────────────────

export type ZineTemplate = {
  id: string;
  name: string;
  emoji: string;
  bg: string;
  elements: Omit<ZineElement, 'id'>[];
};

export const ZINE_TEMPLATES: ZineTemplate[] = [
  {
    id: 'fan-card',
    name: '应援卡',
    emoji: '👑',
    bg: '#2D6A4F',
    elements: [
      { type: 'text', x: 20, y: 20, width: 335, height: 60, rotation: 0,
        text: '球员应援卡', fontSize: 32, fontFamily: 'serif', color: '#ffffff',
        textAlign: 'center', fontWeight: 'bold' },
      { type: 'text', x: 20, y: 420, width: 335, height: 40, rotation: 0,
        text: '永远支持你 ❤️', fontSize: 18, fontFamily: 'serif', color: '#ffd700',
        textAlign: 'center', fontWeight: 'normal' },
      { type: 'badge', x: 140, y: 460, width: 95, height: 24, rotation: 0,
        text: 'WTA · 2026', fontSize: 11, fontFamily: 'sans', color: '#ffffff',
        textAlign: 'center', fontWeight: 'normal' },
    ],
  },
  {
    id: 'match-diary',
    name: '赛事打卡',
    emoji: '🏟️',
    bg: '#F5F0E8',
    elements: [
      { type: 'text', x: 20, y: 20, width: 335, height: 50, rotation: 0,
        text: '赛事打卡日记', fontSize: 28, fontFamily: 'serif', color: '#2D6A4F',
        textAlign: 'center', fontWeight: 'bold' },
      { type: 'text', x: 20, y: 80, width: 335, height: 28, rotation: 0,
        text: '✦ 赛事名称 · 城市 ✦', fontSize: 14, fontFamily: 'sans', color: '#888',
        textAlign: 'center', fontWeight: 'normal' },
      { type: 'text', x: 30, y: 340, width: 315, height: 120, rotation: 0,
        text: '今天的比赛真的太精彩了！每一个球都像是在向世界宣告她的统治力……',
        fontSize: 13, fontFamily: 'serif', color: '#333', textAlign: 'left', fontWeight: 'normal' },
      { type: 'sticker', x: 310, y: 20, width: 40, height: 40, rotation: -12,
        emoji: '🏟️' },
    ],
  },
  {
    id: 'best-moments',
    name: '最佳时刻',
    emoji: '🌟',
    bg: '#1a1a1a',
    elements: [
      { type: 'text', x: 20, y: 20, width: 335, height: 48, rotation: 0,
        text: '2026 Best Moments', fontSize: 26, fontFamily: 'serif', color: '#ffd700',
        textAlign: 'center', fontWeight: 'bold' },
      { type: 'text', x: 20, y: 450, width: 335, height: 36, rotation: 0,
        text: '那些闪光的瞬间', fontSize: 16, fontFamily: 'serif', color: '#ffffff',
        textAlign: 'center', fontWeight: 'normal' },
      { type: 'sticker', x: 15, y: 450, width: 36, height: 36, rotation: 0, emoji: '⭐' },
      { type: 'sticker', x: 324, y: 450, width: 36, height: 36, rotation: 0, emoji: '🏆' },
    ],
  },
  {
    id: 'travel-diary',
    name: '旅行日记',
    emoji: '✈️',
    bg: 'linear-gradient(135deg, #f8e8f0 0%, #ffe4d6 100%)',
    elements: [
      { type: 'sticker', x: 20, y: 16, width: 40, height: 40, rotation: -10, emoji: '✈️' },
      { type: 'text', x: 60, y: 20, width: 250, height: 44, rotation: 0,
        text: '网球旅行日记', fontSize: 24, fontFamily: 'serif', color: '#2D6A4F',
        textAlign: 'center', fontWeight: 'bold' },
      { type: 'sticker', x: 320, y: 16, width: 40, height: 40, rotation: 10, emoji: '🌍' },
      { type: 'text', x: 30, y: 380, width: 315, height: 100, rotation: 0,
        text: '城市名 · 日期\n\n写下你在这座城市追球的故事…',
        fontSize: 13, fontFamily: 'serif', color: '#555', textAlign: 'left', fontWeight: 'normal' },
    ],
  },
  {
    id: 'blank',
    name: '空白画布',
    emoji: '🎨',
    bg: '#ffffff',
    elements: [],
  },
];

// ─── Helper ──────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function isCssGradient(bg: string) {
  return bg.startsWith('linear-gradient') || bg.startsWith('radial-gradient');
}

function bgStyle(bg: string): React.CSSProperties {
  if (isCssGradient(bg)) return { backgroundImage: bg };
  return { backgroundColor: bg };
}

// ─── Sub-components ──────────────────────────────────────────

function ElementRenderer({
  el,
  selected,
  onSelect,
  onDragStart,
}: {
  el: ZineElement;
  selected: boolean;
  onSelect: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent | React.TouchEvent) => void;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.type === 'sticker' ? el.height : undefined,
    transform: `rotate(${el.rotation}deg)`,
    cursor: 'grab',
    userSelect: 'none',
    outline: selected ? '2px solid #3b82f6' : 'none',
    outlineOffset: '2px',
    boxSizing: 'border-box',
  };

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    onSelect(el.id);
    onDragStart(el.id, e);
  };

  if (el.type === 'sticker') {
    return (
      <div
        style={{ ...style, fontSize: el.height, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        {el.emoji}
      </div>
    );
  }

  if (el.type === 'text' || el.type === 'badge') {
    const isSerif = el.fontFamily === 'serif';
    return (
      <div
        style={{
          ...style,
          fontSize: el.fontSize,
          fontFamily: isSerif ? 'var(--font-serif), serif' : 'var(--font-inter), sans-serif',
          color: el.color || '#000',
          textAlign: el.textAlign || 'left',
          fontWeight: el.fontWeight || 'normal',
          lineHeight: 1.4,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          ...(el.type === 'badge' ? {
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.5)',
            borderRadius: 20,
            padding: '2px 10px',
            backdropFilter: 'blur(4px)',
          } : {}),
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        {el.text}
      </div>
    );
  }

  if (el.type === 'image') {
    return (
      <div
        style={{
          ...style,
          height: el.height,
          overflow: 'hidden',
          borderRadius: el.borderRadius ?? 12,
        }}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={el.src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  return null;
}

// ─── Main ZineEditor Component ───────────────────────────────

interface ZineEditorProps {
  initialTemplate?: ZineTemplate;
  existingWork?: ZineWork;
  onSave: (work: ZineWork) => void;
  onClose: () => void;
}

export function ZineEditor({ initialTemplate, existingWork, onSave, onClose }: ZineEditorProps) {
  const [elements, setElements] = useState<ZineElement[]>(() => {
    if (existingWork) return existingWork.elements;
    if (initialTemplate) {
      return initialTemplate.elements.map(el => ({ ...el, id: generateId() }));
    }
    return [];
  });

  const [background, setBackground] = useState<string>(() => {
    if (existingWork) return existingWork.background;
    if (initialTemplate) return initialTemplate.bg;
    return '#ffffff';
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textFontSize, setTextFontSize] = useState(18);
  const [textColor, setTextColor] = useState('#000000');
  const [textFontFamily, setTextFontFamily] = useState<'sans' | 'serif'>('serif');
  const [textFontWeight, setTextFontWeight] = useState<'normal' | 'bold'>('normal');
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [saving, setSaving] = useState(false);
  const [zineTitle, setZineTitle] = useState(existingWork?.title || (initialTemplate?.name ?? '我的手账'));

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  // Top players for image picker
  const topPlayers = getTopPlayers(30);

  const selectedEl = elements.find(e => e.id === selectedId);

  // ── Drag logic ──────────────────────────────────────────────

  const handleDragStart = useCallback((id: string, e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const el = elements.find(el => el.id === id);
    if (!el) return;
    dragging.current = { id, startX: clientX, startY: clientY, origX: el.x, origY: el.y };
  }, [elements]);

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const dx = clientX - dragging.current.startX;
      const dy = clientY - dragging.current.startY;
      const dragId = dragging.current.id;
      const origX = dragging.current.origX;
      const origY = dragging.current.origY;
      setElements(prev => prev.map(el =>
        el.id === dragId
          ? { ...el, x: origX + dx, y: origY + dy }
          : el
      ));
    };
    const handleUp = () => { dragging.current = null; };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: true });
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, []);

  // ── Element operations ───────────────────────────────────────

  const addText = () => {
    if (!textInput.trim()) return;
    const el: ZineElement = {
      id: generateId(),
      type: 'text',
      x: 40, y: 200,
      width: 295, height: 60,
      rotation: 0,
      text: textInput,
      fontSize: textFontSize,
      fontFamily: textFontFamily,
      color: textColor,
      textAlign,
      fontWeight: textFontWeight,
    };
    setElements(prev => [...prev, el]);
    setTextInput('');
    setActiveTool(null);
    setSelectedId(el.id);
  };

  const addSticker = (emoji: string) => {
    const el: ZineElement = {
      id: generateId(),
      type: 'sticker',
      x: 160, y: 210,
      width: 44, height: 44,
      rotation: Math.floor(Math.random() * 20) - 10,
      emoji,
    };
    setElements(prev => [...prev, el]);
    setActiveTool(null);
    setSelectedId(el.id);
  };

  const addPlayerImage = (src: string) => {
    const el: ZineElement = {
      id: generateId(),
      type: 'image',
      x: 88, y: 100,
      width: 200, height: 200,
      rotation: 0,
      src,
      borderRadius: 12,
    };
    setElements(prev => [...prev, el]);
    setActiveTool(null);
    setSelectedId(el.id);
  };

  const deleteSelected = () => {
    if (!selectedId) return;
    setElements(prev => prev.filter(e => e.id !== selectedId));
    setSelectedId(null);
  };

  const updateSelected = (patch: Partial<ZineElement>) => {
    if (!selectedId) return;
    setElements(prev => prev.map(e => e.id === selectedId ? { ...e, ...patch } : e));
  };

  const rotateSelected = (delta: number) => {
    if (!selectedId) return;
    setElements(prev => prev.map(e =>
      e.id === selectedId ? { ...e, rotation: (e.rotation + delta) % 360 } : e
    ));
  };

  // ── Export ──────────────────────────────────────────────────

  const handleExport = async () => {
    if (!canvasRef.current) return;
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
      });
      // watermark
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.font = `${14 * 2}px sans-serif`;
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        ctx.textAlign = 'center';
        ctx.fillText('AceTrip · acetrip.vercel.app', canvas.width / 2, canvas.height - 16);
      }
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `acetrip-zine-${Date.now()}.png`;
      a.click();
    } finally {
      setSaving(false);
    }
  };

  // ── Save to store ────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    let thumbnail: string | undefined;
    try {
      if (canvasRef.current) {
        const html2canvas = (await import('html2canvas')).default;
        const c = await html2canvas(canvasRef.current, { scale: 0.4, useCORS: true, backgroundColor: null });
        thumbnail = c.toDataURL('image/jpeg', 0.6);
      }
    } catch (_) { /* non-critical */ }
    const work: ZineWork = {
      id: existingWork?.id ?? generateId(),
      title: zineTitle,
      createdAt: existingWork?.createdAt ?? new Date().toISOString(),
      elements,
      background,
      thumbnail,
    };
    onSave(work);
    setSaving(false);
  };

  // ── Panel rendering ──────────────────────────────────────────

  const renderToolPanel = () => {
    if (activeTool === 'text') {
      return (
        <div className="bg-[#252525] border border-white/10 rounded-2xl p-4 space-y-3 w-72 shadow-2xl">
          <h3 className="text-white font-semibold text-sm">添加文字</h3>
          <textarea
            className="w-full bg-white/10 text-white rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] placeholder-white/30"
            placeholder="输入文字…"
            rows={3}
            value={textInput}
            onChange={e => setTextInput(e.target.value)}
            autoFocus
          />
          {/* Font size */}
          <div className="flex items-center gap-2">
            <span className="text-white/50 text-xs w-12">字号</span>
            <select
              className="flex-1 bg-white/10 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
              value={textFontSize}
              onChange={e => setTextFontSize(Number(e.target.value))}
            >
              {FONT_SIZES.map(s => <option key={s} value={s} className="bg-[#333]">{s}px</option>)}
            </select>
          </div>
          {/* Font family */}
          <div className="flex gap-2">
            <button
              onClick={() => setTextFontFamily('serif')}
              className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${textFontFamily === 'serif' ? 'bg-[#2D6A4F] text-white' : 'bg-white/10 text-white/60'}`}
            >
              宋体
            </button>
            <button
              onClick={() => setTextFontFamily('sans')}
              className={`flex-1 py-1 rounded-lg text-xs font-medium transition-all ${textFontFamily === 'sans' ? 'bg-[#2D6A4F] text-white' : 'bg-white/10 text-white/60'}`}
            >
              黑体
            </button>
          </div>
          {/* Bold / Align */}
          <div className="flex gap-2">
            <button onClick={() => setTextFontWeight(w => w === 'bold' ? 'normal' : 'bold')}
              className={`p-1.5 rounded-lg transition-all ${textFontWeight === 'bold' ? 'bg-[#2D6A4F] text-white' : 'bg-white/10 text-white/60'}`}>
              <Bold size={14} />
            </button>
            {(['left','center','right'] as const).map(a => (
              <button key={a} onClick={() => setTextAlign(a)}
                className={`p-1.5 rounded-lg transition-all ${textAlign === a ? 'bg-[#2D6A4F] text-white' : 'bg-white/10 text-white/60'}`}>
                {a === 'left' ? <AlignLeft size={14} /> : a === 'center' ? <AlignCenter size={14} /> : <AlignRight size={14} />}
              </button>
            ))}
          </div>
          {/* Color */}
          <div>
            <span className="text-white/50 text-xs block mb-1.5">颜色</span>
            <div className="flex flex-wrap gap-1.5">
              {TEXT_COLORS.map(c => (
                <button key={c} onClick={() => setTextColor(c)}
                  style={{ background: c }}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${textColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={addText}
            disabled={!textInput.trim()}
            className="w-full py-2 rounded-xl text-sm font-semibold bg-[#2D6A4F] text-white disabled:opacity-40 hover:bg-[#245a42] transition-colors"
          >
            添加到画布
          </button>
        </div>
      );
    }

    if (activeTool === 'sticker') {
      return (
        <div className="bg-[#252525] border border-white/10 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-white font-semibold text-sm mb-3">添加贴纸</h3>
          <div className="grid grid-cols-5 gap-2">
            {STICKERS.map(emoji => (
              <button key={emoji} onClick={() => addSticker(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-1 rounded-lg hover:bg-white/10">
                {emoji}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeTool === 'image') {
      return (
        <div className="bg-[#252525] border border-white/10 rounded-2xl p-4 shadow-2xl w-72 max-h-80 overflow-y-auto">
          <h3 className="text-white font-semibold text-sm mb-3">选择球员</h3>
          <div className="grid grid-cols-5 gap-2">
            {topPlayers.map(p => (
              <button key={p.id} onClick={() => addPlayerImage(p.headshot)}
                className="group relative rounded-lg overflow-hidden aspect-square hover:ring-2 ring-[#2D6A4F] transition-all">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.headshot} alt={p.displayName}
                  className="w-full h-full object-cover"
                  crossOrigin="anonymous"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-end">
                  <span className="text-white text-[8px] font-medium p-1 truncate opacity-0 group-hover:opacity-100 transition-all">{p.nameCn}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (activeTool === 'bg') {
      return (
        <div className="bg-[#252525] border border-white/10 rounded-2xl p-4 shadow-2xl">
          <h3 className="text-white font-semibold text-sm mb-3">背景颜色</h3>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUNDS.map(b => (
              <button key={b.id} onClick={() => { setBackground(b.value); setActiveTool(null); }}
                className={`h-12 rounded-xl border-2 transition-all ${background === b.value ? 'border-white scale-105' : 'border-transparent'}`}
                style={isCssGradient(b.value) ? { backgroundImage: b.value } : { backgroundColor: b.value }}
              >
                <span className="text-[10px] font-medium"
                  style={{ color: b.value === '#ffffff' || b.value === '#F5F0E8' ? '#333' : '#fff' }}>
                  {b.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Selected element toolbar ─────────────────────────────────

  const renderSelectionBar = () => {
    if (!selectedEl) return null;
    return (
      <div className="flex items-center gap-2 bg-[#252525]/90 backdrop-blur border border-white/10 rounded-2xl px-3 py-2 shadow-xl">
        <span className="text-white/50 text-xs">已选</span>
        {selectedEl.type === 'text' && (
          <>
            <button onClick={() => updateSelected({ fontWeight: selectedEl.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className="text-white/70 hover:text-white p-1 rounded transition-colors">
              <Bold size={14} />
            </button>
            <div className="flex gap-1">
              {TEXT_COLORS.slice(0, 6).map(c => (
                <button key={c} onClick={() => updateSelected({ color: c })}
                  style={{ background: c }}
                  className={`w-4 h-4 rounded-full border transition-all ${selectedEl.color === c ? 'border-white' : 'border-white/20'}`}
                />
              ))}
            </div>
          </>
        )}
        <button onClick={() => rotateSelected(-15)}
          className="text-white/70 hover:text-white p-1 rounded transition-colors">
          <RotateCcw size={14} />
        </button>
        <button onClick={deleteSelected}
          className="text-red-400 hover:text-red-300 p-1 rounded transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    );
  };

  // ── Main render ──────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-[100] flex flex-col" style={{ background: '#1a1a1a' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-all">
          <ChevronLeft size={20} />
        </button>
        <input
          className="bg-transparent text-white font-semibold text-base text-center focus:outline-none border-b border-transparent focus:border-white/30 transition-all px-2"
          value={zineTitle}
          onChange={e => setZineTitle(e.target.value)}
          maxLength={20}
        />
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-[#2D6A4F] text-white hover:bg-[#245a42] disabled:opacity-50 transition-all">
            <Save size={14} />
            保存
          </button>
          <button onClick={handleExport} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium bg-white/10 text-white hover:bg-white/20 disabled:opacity-50 transition-all">
            <Download size={14} />
            导出
          </button>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas area */}
        <div className="flex-1 flex flex-col items-center justify-start overflow-auto py-6 px-4 gap-4">
          {/* Selection bar */}
          {selectedId && (
            <div className="flex-shrink-0">
              {renderSelectionBar()}
            </div>
          )}

          {/* Canvas */}
          <div
            ref={canvasRef}
            style={{
              width: CANVAS_W,
              height: CANVAS_H,
              position: 'relative',
              flexShrink: 0,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              ...bgStyle(background),
            }}
            onClick={() => setSelectedId(null)}
          >
            {elements.map(el => (
              <ElementRenderer
                key={el.id}
                el={el}
                selected={el.id === selectedId}
                onSelect={setSelectedId}
                onDragStart={handleDragStart}
              />
            ))}
          </div>

          {/* Layer count hint */}
          <div className="flex items-center gap-1.5 text-white/30 text-xs">
            <Layers size={12} />
            {elements.length} 个元素 · 点击元素选中后可拖动
          </div>
        </div>

        {/* Right toolbar */}
        <div className="flex flex-col items-center gap-3 px-3 py-6 border-l border-white/10 w-16">
          {[
            { id: 'text',    icon: Type,        label: '文字' },
            { id: 'sticker', icon: Smile,       label: '贴纸' },
            { id: 'image',   icon: ImageIcon,   label: '球员' },
            { id: 'bg',      icon: Palette,     label: '背景' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTool(prev => prev === id ? null : id)}
              className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all w-full ${
                activeTool === id
                  ? 'bg-[#2D6A4F] text-white'
                  : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon size={20} strokeWidth={activeTool === id ? 2.5 : 1.8} />
              <span className="text-[9px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom panel overlay */}
      {activeTool && (
        <div
          className="absolute inset-0 z-10 flex items-end md:items-center md:justify-center pointer-events-none"
          style={{ top: 60 }}
        >
          <div className="pointer-events-auto mb-20 md:mb-0 mx-4 md:mx-0" onClick={e => e.stopPropagation()}>
            {renderToolPanel()}
          </div>
          <button
            className="pointer-events-auto fixed top-20 right-20 md:right-24 z-20 text-white/50 hover:text-white"
            onClick={() => setActiveTool(null)}
          >
            <X size={18} />
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef, useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Shared interfaces & types (must come first for Canvas utils)
// ─────────────────────────────────────────────────────────────

export interface ShareCardProps {
  mode: 'passport' | 'checkin' | 'season' | 'player';
  onClose: () => void;

  // passport 模式
  passportData?: {
    completedCount: number;
    pendingCount: number;
    countries: number;
    achievements: { emoji: string; name: string; unlocked: boolean }[];
    stamps: { name: string; city: string; yearMonth: string }[];
  };

  // checkin 模式
  checkinData?: {
    tournamentName: string;
    city: string;
    country: string;
    date: string;
    level: string;
    surface: string;
  };

  // season 模式
  seasonData?: {
    totalCheckins: number;
    countries: number;
    favoritePlayer: string;
    achievements: { emoji: string; name: string }[];
  };

  // player 模式
  playerData?: {
    nameCn: string;
    nameEn: string;
    rank: number;
    points: number;
    country: string;
    countryFlag: string;
    headshot: string;
    wins: number;
    losses: number;
    titles: number;
  };
}

type CardStyle = 'classic' | 'magazine' | 'neon' | 'minimal';
type PlayerCardData = NonNullable<ShareCardProps['playerData']>;

// ─────────────────────────────────────────────────────────────
// Canvas image loader (CORS-safe via proxy)
// ─────────────────────────────────────────────────────────────

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  });
}

// Helper: draw an image with object-fit:cover into a rect
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
) {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const rectRatio = dw / dh;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgRatio > rectRatio) {
    sw = img.naturalHeight * rectRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / rectRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

// Helper: draw circular clipped image with border
function drawCircleAvatar(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null,
  cx: number,
  cy: number,
  r: number,
  borderColor: string,
  borderWidth: number,
  fallbackInitials: string,
) {
  ctx.save();
  // Border ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + borderWidth, 0, Math.PI * 2);
  ctx.fillStyle = borderColor;
  ctx.fill();
  // Clip circle
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  if (img) {
    drawImageCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
  } else {
    // Gradient fallback
    const grad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
    grad.addColorStop(0, '#2D6A4F');
    grad.addColorStop(1, '#40916C');
    ctx.fillStyle = grad;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = `bold ${Math.round(r * 0.7)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(fallbackInitials.slice(0, 2).toUpperCase(), cx, cy);
  }
  ctx.restore();
}

// Helper: centered text
function fillTextCentered(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  y: number,
) {
  const w = ctx.measureText(text).width;
  ctx.fillText(text, cx - w / 2, y);
}

// ─────────────────────────────────────────────────────────────
// drawPassportCard — Canvas export for passport mode
// ─────────────────────────────────────────────────────────────

type PassportData = NonNullable<ShareCardProps['passportData']>;
type CheckinData = NonNullable<ShareCardProps['checkinData']>;
type SeasonData = NonNullable<ShareCardProps['seasonData']>;

function drawPassportCard(
  ctx: CanvasRenderingContext2D,
  data: PassportData,
  width: number,
  height: number,
) {
  const cx = width / 2;

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#1B4332');
  bg.addColorStop(0.6, '#2D6A4F');
  bg.addColorStop(1, '#1a3d2b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Decorative gloss
  const gloss = ctx.createLinearGradient(0, 0, width * 0.6, height);
  gloss.addColorStop(0.4, 'transparent');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  gloss.addColorStop(0.6, 'transparent');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, width, height);

  // ── Title
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(246,216,96,0.7)';
  ctx.font = `400 22px Georgia, serif`;
  fillTextCentered(ctx, 'TENNIS PASSPORT', cx, 70);

  ctx.fillStyle = '#D4AF37';
  ctx.font = `700 34px 'Noto Serif SC', 'PingFang SC', serif`;
  fillTextCentered(ctx, '🎾 AceTrip Tennis Passport', cx, 116);

  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = `400 20px 'Noto Serif SC', 'PingFang SC', serif`;
  fillTextCentered(ctx, '每一枚印章，都是一段故事', cx, 148);

  // ── Stats row (3 columns)
  const statsY = 178;
  const statsH = 110;
  const statsW = 560;
  const statsX = (width - statsW) / 2;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.roundRect(statsX, statsY, statsW, statsH, 18);
  ctx.fill();

  const statCols = [
    { label: '已打卡', value: String(data.completedCount), gold: true },
    { label: '心愿站', value: String(data.pendingCount), gold: false },
    { label: '足迹国家', value: String(data.countries), gold: true },
  ];
  const colW = statsW / 3;
  statCols.forEach((col, i) => {
    const colCx = statsX + colW * i + colW / 2;
    if (i > 0) {
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(statsX + colW * i, statsY + 16);
      ctx.lineTo(statsX + colW * i, statsY + statsH - 16);
      ctx.stroke();
    }
    ctx.fillStyle = col.gold ? '#D4AF37' : '#ffffff';
    ctx.font = `800 46px Georgia, serif`;
    ctx.textAlign = 'center';
    fillTextCentered(ctx, col.value, colCx, statsY + 68);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `400 18px 'Noto Serif SC', 'PingFang SC', serif`;
    fillTextCentered(ctx, col.label, colCx, statsY + 96);
  });

  // ── Stamps section
  const stamps = data.stamps.slice(0, 8);
  let sectionY = statsY + statsH + 36;

  if (stamps.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `400 18px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('足迹印章', statsX, sectionY);
    sectionY += 28;

    const stampR = 44;
    const stampGap = 14;
    const stampsPerRow = 4;
    const rowH = stampR * 2 + stampGap + 26; // circle + city label row
    const stampStartX = (width - (stampsPerRow * (stampR * 2) + (stampsPerRow - 1) * stampGap)) / 2;

    stamps.forEach((stamp, i) => {
      const col = i % stampsPerRow;
      const row = Math.floor(i / stampsPerRow);
      const sx = stampStartX + col * (stampR * 2 + stampGap) + stampR;
      const sy = sectionY + row * rowH + stampR;

      // Gold circle border
      ctx.beginPath();
      ctx.arc(sx, sy, stampR, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(212,175,55,0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(212,175,55,0.08)';
      ctx.fill();

      // Stamp abbreviation
      const abbr = stamp.name.slice(0, 4);
      ctx.fillStyle = '#D4AF37';
      ctx.font = `700 16px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(abbr, sx, sy - 8);

      // City
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = `400 13px 'Noto Serif SC', 'PingFang SC', serif`;
      ctx.fillText(stamp.city.slice(0, 4), sx, sy + 10);

      // Year/month under circle
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.font = `400 12px Georgia, serif`;
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(stamp.yearMonth, sx, sy + stampR + 18);
    });

    const stampRows = Math.ceil(stamps.length / stampsPerRow);
    sectionY += stampRows * rowH + 16;
  }

  // ── Achievements section
  const unlockedAchs = data.achievements.filter((a) => a.unlocked).slice(0, 6);
  if (unlockedAchs.length > 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `400 18px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`已解锁成就 · ${unlockedAchs.length}`, statsX, sectionY);
    sectionY += 28;

    const achPerRow = 3;
    const achW = 168;
    const achH = 44;
    const achGapX = 16;
    const achGapY = 12;
    const achTotalW = achPerRow * achW + (achPerRow - 1) * achGapX;
    const achStartX = (width - achTotalW) / 2;

    unlockedAchs.forEach((ach, i) => {
      const col = i % achPerRow;
      const row = Math.floor(i / achPerRow);
      const ax = achStartX + col * (achW + achGapX);
      const ay = sectionY + row * (achH + achGapY);

      ctx.fillStyle = 'rgba(246,216,96,0.18)';
      ctx.beginPath();
      ctx.roundRect(ax, ay, achW, achH, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(246,216,96,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = `500 20px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(ach.emoji, ax + 10, ay + achH / 2);

      ctx.fillStyle = '#D4AF37';
      ctx.font = `600 14px 'Noto Serif SC', 'PingFang SC', serif`;
      ctx.fillText(ach.name, ax + 36, ay + achH / 2);
    });
  }

  // ── Watermark
  const wmarkY = height - 80;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, wmarkY);
  ctx.lineTo(width - 60, wmarkY);
  ctx.stroke();

  ctx.font = `700 24px Georgia, serif`;
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎾  AceTrip', 60, wmarkY + 34);

  ctx.font = `400 20px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textAlign = 'right';
  ctx.fillText('acetrip.vercel.app', width - 60, wmarkY + 34);
}

// ─────────────────────────────────────────────────────────────
// drawCheckinCard — Canvas export for checkin mode
// ─────────────────────────────────────────────────────────────

function drawCheckinCard(
  ctx: CanvasRenderingContext2D,
  data: CheckinData,
  width: number,
  height: number,
) {
  const cx = width / 2;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#1B4332');
  bg.addColorStop(0.6, '#2D6A4F');
  bg.addColorStop(1, '#1a3d2b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Gloss
  const gloss = ctx.createLinearGradient(0, 0, width * 0.6, height);
  gloss.addColorStop(0.4, 'transparent');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  gloss.addColorStop(0.6, 'transparent');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, width, height);

  const levelMap: Record<string, string> = {
    GS: 'Grand Slam',
    WTA1000: 'WTA 1000',
    WTA500: 'WTA 500',
    WTA250: 'WTA 250',
    Finals: 'WTA Finals',
  };
  const levelLabel = levelMap[data.level] || data.level;

  const surfaceMap: Record<string, string> = {
    Hard: '硬地',
    Clay: '红土',
    Grass: '草地',
  };
  const surfaceLabel = surfaceMap[data.surface] || data.surface;

  // Center the main block vertically
  const midY = height / 2 - 40;

  // Level badge
  const levelText = levelLabel;
  ctx.font = `600 22px Georgia, serif`;
  const levelW = ctx.measureText(levelText).width + 48;
  const levelH = 42;
  const levelX = (width - levelW) / 2;
  const levelBadgeY = midY - 200;
  ctx.fillStyle = 'rgba(246,216,96,0.2)';
  ctx.beginPath();
  ctx.roundRect(levelX, levelBadgeY, levelW, levelH, 21);
  ctx.fill();
  ctx.strokeStyle = 'rgba(246,216,96,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(levelText, cx, levelBadgeY + levelH / 2);

  // Tournament name
  const nameFontSize = data.tournamentName.length > 14 ? 42 : 52;
  ctx.fillStyle = '#ffffff';
  ctx.font = `800 ${nameFontSize}px 'Noto Serif SC', 'PingFang SC', serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  // Wrap if long
  const maxLineW = 620;
  const words = data.tournamentName;
  if (ctx.measureText(words).width <= maxLineW) {
    fillTextCentered(ctx, words, cx, midY - 120);
  } else {
    // Split roughly in half
    const half = Math.ceil(words.length / 2);
    const line1 = words.slice(0, half);
    const line2 = words.slice(half);
    fillTextCentered(ctx, line1, cx, midY - 140);
    fillTextCentered(ctx, line2, cx, midY - 84);
  }

  // City · Country
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.font = `400 26px 'Noto Serif SC', 'PingFang SC', serif`;
  fillTextCentered(ctx, `${data.city} · ${data.country}`, cx, midY - 44);

  // "📍 我在现场" badge
  const badgeText = '📍 我在现场';
  ctx.font = `700 28px 'Noto Serif SC', 'PingFang SC', serif`;
  const badgeW = ctx.measureText(badgeText).width + 56;
  const badgeH = 56;
  const badgeX = (width - badgeW) / 2;
  const badgeY = midY - 16;
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 14);
  ctx.fill();
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, cx, badgeY + badgeH / 2);

  // Surface
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = `400 22px 'Noto Serif SC', 'PingFang SC', serif`;
  ctx.textBaseline = 'alphabetic';
  fillTextCentered(ctx, surfaceLabel, cx, midY + 76);

  // Date
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `400 22px Georgia, serif`;
  fillTextCentered(ctx, data.date, cx, midY + 110);

  // ── Watermark
  const wmarkY = height - 80;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, wmarkY);
  ctx.lineTo(width - 60, wmarkY);
  ctx.stroke();

  ctx.font = `700 24px Georgia, serif`;
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎾  AceTrip', 60, wmarkY + 34);

  ctx.font = `400 20px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textAlign = 'right';
  ctx.fillText('acetrip.vercel.app', width - 60, wmarkY + 34);
}

// ─────────────────────────────────────────────────────────────
// drawSeasonCard — Canvas export for season mode
// ─────────────────────────────────────────────────────────────

function drawSeasonCard(
  ctx: CanvasRenderingContext2D,
  data: SeasonData,
  width: number,
  height: number,
) {
  const cx = width / 2;

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#1B4332');
  bg.addColorStop(0.6, '#2D6A4F');
  bg.addColorStop(1, '#1a3d2b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  // Gloss
  const gloss = ctx.createLinearGradient(0, 0, width * 0.6, height);
  gloss.addColorStop(0.4, 'transparent');
  gloss.addColorStop(0.5, 'rgba(255,255,255,0.04)');
  gloss.addColorStop(0.6, 'transparent');
  ctx.fillStyle = gloss;
  ctx.fillRect(0, 0, width, height);

  // ── Header
  ctx.fillStyle = 'rgba(212,175,55,0.7)';
  ctx.font = `400 20px Georgia, serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  fillTextCentered(ctx, 'MY SEASON', cx, 80);

  ctx.fillStyle = '#D4AF37';
  ctx.font = `800 42px 'Noto Serif SC', 'PingFang SC', serif`;
  fillTextCentered(ctx, '2026 Season Recap', cx, 132);

  // ── Big stats (3 rows)
  const statItems = [
    { icon: '🎾', label: '总打卡站数', value: String(data.totalCheckins), gold: true },
    { icon: '🌍', label: '足迹国家数', value: String(data.countries), gold: false },
    ...(data.favoritePlayer
      ? [{ icon: '⭐', label: '最爱球员', value: data.favoritePlayer, gold: true, text: true }]
      : []),
  ] as { icon: string; label: string; value: string; gold: boolean; text?: boolean }[];

  const boxW = 560;
  const boxH = 88;
  const boxGap = 16;
  const boxX = (width - boxW) / 2;
  let boxY = 164;

  statItems.forEach((item) => {
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 14);
    ctx.fill();

    // Icon + label
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = `400 22px 'Noto Serif SC', 'PingFang SC', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${item.icon} ${item.label}`, boxX + 24, boxY + boxH / 2);

    // Value
    ctx.fillStyle = item.gold ? '#D4AF37' : '#ffffff';
    if (item.text) {
      ctx.font = `700 24px 'Noto Serif SC', 'PingFang SC', serif`;
    } else {
      ctx.font = `800 46px Georgia, serif`;
    }
    ctx.textAlign = 'right';
    ctx.fillText(item.value, boxX + boxW - 24, boxY + boxH / 2);

    boxY += boxH + boxGap;
  });

  // ── Achievements
  const achs = data.achievements.slice(0, 4);
  if (achs.length > 0) {
    boxY += 8;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = `400 18px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('本赛季成就', boxX, boxY);
    boxY += 28;

    const achW = (boxW - (achs.length - 1) * 12) / Math.min(achs.length, 2);
    const achH = 48;
    const achPerRow = 2;

    achs.forEach((ach, i) => {
      const col = i % achPerRow;
      const row = Math.floor(i / achPerRow);
      const ax = boxX + col * (achW + 12);
      const ay = boxY + row * (achH + 12);

      ctx.fillStyle = 'rgba(246,216,96,0.15)';
      ctx.beginPath();
      ctx.roundRect(ax, ay, achW, achH, 10);
      ctx.fill();
      ctx.strokeStyle = 'rgba(246,216,96,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = `500 20px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(ach.emoji, ax + 12, ay + achH / 2);

      ctx.fillStyle = '#D4AF37';
      ctx.font = `600 15px 'Noto Serif SC', 'PingFang SC', serif`;
      ctx.fillText(ach.name, ax + 38, ay + achH / 2);
    });
  }

  // ── Watermark
  const wmarkY = height - 80;
  ctx.strokeStyle = 'rgba(255,255,255,0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, wmarkY);
  ctx.lineTo(width - 60, wmarkY);
  ctx.stroke();

  ctx.font = `700 24px Georgia, serif`;
  ctx.fillStyle = '#D4AF37';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎾  AceTrip', 60, wmarkY + 34);

  ctx.font = `400 20px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textAlign = 'right';
  ctx.fillText('acetrip.vercel.app', width - 60, wmarkY + 34);
}

// ─────────────────────────────────────────────────────────────
// drawPlayerCard — the heart of Canvas export
// ─────────────────────────────────────────────────────────────

function drawPlayerCard(
  ctx: CanvasRenderingContext2D,
  style: CardStyle,
  data: PlayerCardData,
  headshotImg: HTMLImageElement | null,
  width: number,
  height: number,
) {
  const cx = width / 2;
  const initials = data.nameEn.split(' ').map((w: string) => w[0]).slice(0, 2).join('');

  if (style === 'classic') {
    // ── Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#1B4332');
    bg.addColorStop(0.55, '#2D6A4F');
    bg.addColorStop(1, '#1a3d2b');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // ── Gloss overlay (diagonal)
    const gloss = ctx.createLinearGradient(0, 0, width * 0.6, height);
    gloss.addColorStop(0.4, 'transparent');
    gloss.addColorStop(0.5, 'rgba(255,255,255,0.04)');
    gloss.addColorStop(0.6, 'transparent');
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, width, height);

    // ── Avatar (centered, radius 80 = 160px diameter)
    const avatarR = 80;
    const avatarY = 160;
    drawCircleAvatar(ctx, headshotImg, cx, avatarY, avatarR, '#F6D860', 5, initials);

    // ── Player name (Chinese)
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 52px 'Noto Serif SC', 'PingFang SC', 'Hiragino Sans GB', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fillTextCentered(ctx, data.nameCn, cx, avatarY + avatarR + 60);

    // ── English name
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `400 26px Georgia, serif`;
    fillTextCentered(ctx, data.nameEn, cx, avatarY + avatarR + 95);

    // ── Rank + Points box
    const boxY = avatarY + avatarR + 130;
    const boxW = 420;
    const boxH = 110;
    const boxX = (width - boxW) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 20);
    ctx.fill();

    // divider
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, boxY + 16);
    ctx.lineTo(cx, boxY + boxH - 16);
    ctx.stroke();

    // rank value
    ctx.fillStyle = '#F6D860';
    ctx.font = `800 48px Georgia, serif`;
    ctx.textAlign = 'center';
    fillTextCentered(ctx, `#${data.rank}`, boxX + boxW * 0.25, boxY + 62);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `400 20px Georgia, serif`;
    fillTextCentered(ctx, '世界排名', boxX + boxW * 0.25, boxY + 88);

    // points value
    ctx.fillStyle = '#ffffff';
    ctx.font = `800 42px Georgia, serif`;
    fillTextCentered(ctx, data.points.toLocaleString(), boxX + boxW * 0.75, boxY + 62);
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.font = `400 20px Georgia, serif`;
    fillTextCentered(ctx, '积分', boxX + boxW * 0.75, boxY + 88);

    // ── Country
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.font = `400 26px 'Noto Serif SC', 'PingFang SC', serif`;
    fillTextCentered(ctx, `${data.countryFlag} ${data.country}`, cx, boxY + boxH + 50);

    // ── Season stats box
    const statsY = boxY + boxH + 70;
    const statsW = 340;
    const statsH = 60;
    const statsX = (width - statsW) / 2;
    ctx.fillStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.roundRect(statsX, statsY, statsW, statsH, 14);
    ctx.fill();

    const statsText = `${data.wins}胜 ${data.losses}负${data.titles > 0 ? ` · ${data.titles}冠` : ''}`;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = `600 26px 'Noto Serif SC', 'PingFang SC', serif`;
    fillTextCentered(ctx, statsText, cx, statsY + 38);

    // ── "我关注的球员" label
    ctx.fillStyle = 'rgba(246,216,96,0.7)';
    ctx.font = `400 22px 'Noto Serif SC', 'PingFang SC', serif`;
    fillTextCentered(ctx, '我关注的球员', cx, statsY + statsH + 46);

    // ── Watermark divider
    const wmarkY = height - 80;
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, wmarkY);
    ctx.lineTo(width - 60, wmarkY);
    ctx.stroke();

    // 🎾 AceTrip
    ctx.font = `700 24px Georgia, serif`;
    ctx.fillStyle = '#F6D860';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎾  AceTrip', 60, wmarkY + 34);

    ctx.font = `400 20px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('acetrip.vercel.app', width - 60, wmarkY + 34);

  } else if (style === 'magazine') {
    // ── Left half: white; Right half: light gray
    ctx.fillStyle = '#f5f5f0';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#ebebeb';
    ctx.fillRect(width / 2, 0, width / 2, height);

    // ── Left: full-height player photo
    const leftW = Math.round(width * 0.46);
    if (headshotImg) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, leftW, height);
      ctx.clip();
      drawImageCover(ctx, headshotImg, 0, 0, leftW, height);
      // Gradient overlay on right edge
      const edgeGrad = ctx.createLinearGradient(leftW - leftW * 0.4, 0, leftW, 0);
      edgeGrad.addColorStop(0, 'transparent');
      edgeGrad.addColorStop(1, '#f5f5f0');
      ctx.fillStyle = edgeGrad;
      ctx.fillRect(0, 0, leftW, height);
      ctx.restore();
    } else {
      const grad = ctx.createLinearGradient(0, 0, leftW, height);
      grad.addColorStop(0, '#2D6A4F');
      grad.addColorStop(1, '#1B4332');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, leftW, height);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = `900 120px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials, leftW / 2, height / 2);
    }

    // ── Big rank watermark (behind text on right side)
    ctx.fillStyle = 'rgba(0,0,0,0.05)';
    ctx.font = `900 220px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(data.rank), leftW + 20, height - 100);

    // ── Right side text content
    const rx = leftW + 32; // left edge of text
    const rw = width - rx - 40; // usable width
    let ry = 80;

    // Label
    ctx.fillStyle = '#2D6A4F';
    ctx.font = `600 18px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('WTA · 我关注的球员', rx, ry);
    ry += 36;

    // Chinese name
    ctx.fillStyle = '#111111';
    ctx.font = `900 50px 'Noto Serif SC', 'PingFang SC', serif`;
    ctx.fillText(data.nameCn, rx, ry);
    ry += 14;

    // English name
    ctx.fillStyle = '#888888';
    ctx.font = `400 24px Georgia, serif`;
    ctx.fillText(data.nameEn, rx, ry + 24);
    ry += 56;

    // Big rank number
    ctx.fillStyle = '#111111';
    ctx.font = `900 94px Georgia, serif`;
    ctx.fillText(`#${data.rank}`, rx, ry);
    ry += 16;

    // "世界排名" label
    ctx.fillStyle = '#aaaaaa';
    ctx.font = `400 18px Georgia, serif`;
    ctx.fillText('世界排名', rx, ry + 20);
    ry += 48;

    // Green accent divider
    ctx.fillStyle = '#2D6A4F';
    ctx.fillRect(rx, ry, 64, 4);
    ry += 28;

    // Stats rows
    const statRows = [
      { label: '积分', value: data.points.toLocaleString() },
      { label: '战绩', value: `${data.wins}W / ${data.losses}L` },
      ...(data.titles > 0 ? [{ label: '冠军', value: `${data.titles} 🏆` }] : []),
      { label: '国籍', value: `${data.countryFlag} ${data.country}` },
    ];
    for (const row of statRows) {
      ctx.fillStyle = '#aaaaaa';
      ctx.font = `400 18px Georgia, serif`;
      ctx.textAlign = 'left';
      ctx.fillText(row.label, rx, ry);
      ctx.fillStyle = row.label === '积分' || row.label === '冠军' ? '#2D6A4F' : '#333333';
      ctx.font = `700 28px 'Noto Serif SC', 'PingFang SC', serif`;
      ctx.textAlign = 'right';
      ctx.fillText(row.value, width - 40, ry);
      ctx.textAlign = 'left';
      ry += 46;
    }

    // Watermark
    const wmarkY2 = height - 56;
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leftW + 20, wmarkY2);
    ctx.lineTo(width - 20, wmarkY2);
    ctx.stroke();

    ctx.font = `700 22px Georgia, serif`;
    ctx.fillStyle = '#2D6A4F';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎾  AceTrip', leftW + 20, wmarkY2 + 28);

    ctx.font = `400 18px Georgia, serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('acetrip.vercel.app', width - 20, wmarkY2 + 28);

  } else if (style === 'neon') {
    // ── Neon / Vintage style (warm dark)
    const bg3 = ctx.createLinearGradient(0, 0, 0, height);
    bg3.addColorStop(0, '#0a0a0a');
    bg3.addColorStop(1, '#0d2818');
    ctx.fillStyle = bg3;
    ctx.fillRect(0, 0, width, height);

    // Glow circle behind avatar
    const avatarR3 = 84;
    const avatarY3 = 160;
    ctx.save();
    ctx.shadowColor = 'rgba(45,106,79,0.6)';
    ctx.shadowBlur = 60;
    ctx.beginPath();
    ctx.arc(cx, avatarY3, avatarR3 + 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(45,106,79,0.8)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    drawCircleAvatar(ctx, headshotImg, cx, avatarY3, avatarR3, 'rgba(45,106,79,0.8)', 3, initials);

    // Gradient name
    const nameGrad = ctx.createLinearGradient(cx - 150, 0, cx + 150, 0);
    nameGrad.addColorStop(0, '#52d68a');
    nameGrad.addColorStop(1, '#40e0d0');
    ctx.fillStyle = nameGrad;
    ctx.font = `900 52px 'Noto Serif SC', 'PingFang SC', serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    fillTextCentered(ctx, data.nameCn, cx, avatarY3 + avatarR3 + 58);

    ctx.fillStyle = 'rgba(82,214,138,0.5)';
    ctx.font = `400 24px Georgia, serif`;
    fillTextCentered(ctx, data.nameEn, cx, avatarY3 + avatarR3 + 92);

    // Rank + Points boxes (side by side)
    const boxY3 = avatarY3 + avatarR3 + 120;
    const bw = 180;
    const bh = 100;
    const gap3 = 24;
    const box1x = cx - bw - gap3 / 2;
    const box2x = cx + gap3 / 2;

    const drawNeonBox = (bx: number, val: string, label: string, valColor: string) => {
      ctx.save();
      ctx.shadowColor = 'rgba(45,106,79,0.3)';
      ctx.shadowBlur = 24;
      ctx.fillStyle = 'rgba(45,106,79,0.2)';
      ctx.beginPath();
      ctx.roundRect(bx, boxY3, bw, bh, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(45,106,79,0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = valColor;
      ctx.font = `900 46px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      fillTextCentered(ctx, val, bx + bw / 2, boxY3 + 60);

      ctx.fillStyle = valColor.replace('1)', '0.5)').replace('rgb', 'rgba').replace(/#[0-9a-fA-F]+/, (hex) => {
        // convert hex to rgba with 0.5 alpha
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},0.5)`;
      });
      ctx.font = `400 18px Georgia, serif`;
      fillTextCentered(ctx, label, bx + bw / 2, boxY3 + 84);
    };

    drawNeonBox(box1x, `#${data.rank}`, 'RANK', '#52d68a');
    drawNeonBox(box2x, data.points.toLocaleString(), 'PTS', '#40e0d0');

    // Country
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `400 26px 'Noto Serif SC', 'PingFang SC', serif`;
    ctx.textAlign = 'center';
    fillTextCentered(ctx, `${data.countryFlag} ${data.country}`, cx, boxY3 + bh + 54);

    // Stats row (W / L / 🏆)
    const statsItems = [
      { label: 'W', value: String(data.wins), color: '#52d68a' },
      { label: 'L', value: String(data.losses), color: '#ff6b6b' },
      ...(data.titles > 0 ? [{ label: '🏆', value: String(data.titles), color: '#F6D860' }] : []),
    ];
    const statBoxW = 120;
    const statBoxH = 80;
    const statsTotalW = statsItems.length * statBoxW + (statsItems.length - 1) * 20;
    let sx3 = cx - statsTotalW / 2;
    const sy3 = boxY3 + bh + 78;

    for (const s of statsItems) {
      ctx.fillStyle = 'rgba(255,255,255,0.04)';
      ctx.beginPath();
      ctx.roundRect(sx3, sy3, statBoxW, statBoxH, 14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = s.color;
      ctx.font = `800 32px Georgia, serif`;
      ctx.textAlign = 'center';
      fillTextCentered(ctx, s.value, sx3 + statBoxW / 2, sy3 + 46);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.font = `400 18px Georgia, serif`;
      fillTextCentered(ctx, s.label, sx3 + statBoxW / 2, sy3 + 68);
      sx3 += statBoxW + 20;
    }

    // 我关注的球员 label
    ctx.fillStyle = 'rgba(82,214,138,0.4)';
    ctx.font = `400 20px 'Noto Serif SC', 'PingFang SC', serif`;
    ctx.textAlign = 'center';
    fillTextCentered(ctx, '我关注的球员', cx, sy3 + statBoxH + 46);

    // Watermark
    const wmarkY3 = height - 76;
    ctx.strokeStyle = 'rgba(45,106,79,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(60, wmarkY3);
    ctx.lineTo(width - 60, wmarkY3);
    ctx.stroke();

    ctx.font = `700 22px Georgia, serif`;
    ctx.fillStyle = '#52d68a';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎾  AceTrip', 60, wmarkY3 + 32);

    ctx.font = `400 18px Georgia, serif`;
    ctx.fillStyle = 'rgba(82,214,138,0.3)';
    ctx.textAlign = 'right';
    ctx.fillText('acetrip.vercel.app', width - 60, wmarkY3 + 32);

  } else if (style === 'minimal') {
    // ── Minimal: white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Top row: small avatar + name
    const avatarR4 = 42;
    const avatarX4 = 60 + avatarR4;
    const avatarY4 = 60 + avatarR4;

    // Avatar border
    ctx.beginPath();
    ctx.arc(avatarX4, avatarY4, avatarR4 + 2, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(45,106,79,0.3)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX4, avatarY4, avatarR4, 0, Math.PI * 2);
    ctx.clip();
    if (headshotImg) {
      drawImageCover(ctx, headshotImg, avatarX4 - avatarR4, avatarY4 - avatarR4, avatarR4 * 2, avatarR4 * 2);
    } else {
      const grad4 = ctx.createLinearGradient(avatarX4 - avatarR4, avatarY4 - avatarR4, avatarX4 + avatarR4, avatarY4 + avatarR4);
      grad4.addColorStop(0, '#2D6A4F');
      grad4.addColorStop(1, '#40916C');
      ctx.fillStyle = grad4;
      ctx.fillRect(avatarX4 - avatarR4, avatarY4 - avatarR4, avatarR4 * 2, avatarR4 * 2);
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(avatarR4 * 0.7)}px Georgia, serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(initials.slice(0, 2).toUpperCase(), avatarX4, avatarY4);
    }
    ctx.restore();

    // Name next to avatar
    const nameX4 = avatarX4 + avatarR4 + 24;
    ctx.fillStyle = '#111111';
    ctx.font = `700 36px 'Noto Serif SC', 'PingFang SC', serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(data.nameCn, nameX4, avatarY4 - 6);
    ctx.fillStyle = '#999999';
    ctx.font = `400 20px Georgia, serif`;
    ctx.fillText(data.nameEn, nameX4, avatarY4 + 22);

    // Large rank
    const rankY4 = 240;
    ctx.fillStyle = '#111111';
    ctx.font = `900 140px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(`#${data.rank}`, 56, rankY4);

    ctx.fillStyle = '#aaaaaa';
    ctx.font = `400 20px Georgia, serif`;
    ctx.fillText('世界排名', 60, rankY4 + 30);

    // Thin divider
    ctx.strokeStyle = '#e8e8e8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, rankY4 + 60);
    ctx.lineTo(width - 60, rankY4 + 60);
    ctx.stroke();

    // Stats grid (2 columns)
    const gridItems = [
      { label: 'POINTS', value: data.points.toLocaleString(), accent: true },
      { label: 'COUNTRY', value: `${data.countryFlag} ${data.country}`, accent: false },
      { label: 'WINS / LOSSES', value: `${data.wins} / ${data.losses}`, accent: false },
      data.titles > 0
        ? { label: 'TITLES', value: `${data.titles} 🏆`, accent: true }
        : { label: 'SEASON', value: '2026', accent: false },
    ];

    const gridStartY = rankY4 + 90;
    const colW = (width - 120) / 2;
    gridItems.forEach((item, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const gx = 60 + col * colW;
      const gy = gridStartY + row * 110;

      ctx.fillStyle = '#cccccc';
      ctx.font = `400 16px Georgia, serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(item.label, gx, gy);

      ctx.fillStyle = item.accent ? '#2D6A4F' : '#333333';
      ctx.font = `600 28px 'Noto Serif SC', 'PingFang SC', serif`;
      ctx.fillText(item.value, gx, gy + 36);
    });

    // Bottom watermark area
    const wmarkY4 = height - 72;
    ctx.fillStyle = 'rgba(0,0,0,0)';
    // 我关注的球员
    ctx.fillStyle = '#cccccc';
    ctx.font = `400 18px Georgia, serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('我关注的球员', 60, wmarkY4 + 20);

    ctx.font = `700 20px Georgia, serif`;
    ctx.fillStyle = '#2D6A4F';
    ctx.textAlign = 'right';
    ctx.fillText('🎾  AceTrip', width - 60, wmarkY4 + 20);
  }
}

// ─────────────────────────────────────────────────────────────
// Card Style Options (UI)
// ─────────────────────────────────────────────────────────────

interface StyleOption {
  id: CardStyle;
  label: string;
  preview: string; // CSS background for preview swatch
  icon: string;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'classic',
    label: '经典',
    preview: 'linear-gradient(135deg, #1B4332 0%, #40916C 100%)',
    icon: '◆',
  },
  {
    id: 'magazine',
    label: '杂志',
    preview: 'linear-gradient(135deg, #f5f5f0 0%, #e8e8e0 100%)',
    icon: '▣',
  },
  {
    id: 'neon',
    label: '复古',
    preview: 'linear-gradient(135deg, #0a0a0a 0%, #0d2818 100%)',
    icon: '✦',
  },
  {
    id: 'minimal',
    label: '极简',
    preview: 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)',
    icon: '○',
  },
];

// ─────────────────────────────────────────────────────────────
// Level label helper
// ─────────────────────────────────────────────────────────────

function getLevelLabel(level: string): string {
  const map: Record<string, string> = {
    GS: 'Grand Slam',
    WTA1000: 'WTA 1000',
    WTA500: 'WTA 500',
    WTA250: 'WTA 250',
    Finals: 'WTA Finals',
  };
  return map[level] || level;
}

// ─────────────────────────────────────────────────────────────
// Style Tab Picker
// ─────────────────────────────────────────────────────────────

function StylePicker({
  options,
  selected,
  onChange,
}: {
  options: StyleOption[];
  selected: CardStyle;
  onChange: (id: CardStyle) => void;
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          title={opt.label}
          className="flex flex-col items-center gap-1 focus:outline-none"
        >
          <div
            className="w-10 h-10 rounded-xl transition-all flex items-center justify-center text-sm"
            style={{
              background: opt.preview,
              border: selected === opt.id
                ? '2.5px solid #F6D860'
                : '2px solid rgba(255,255,255,0.3)',
              transform: selected === opt.id ? 'scale(1.1)' : 'scale(1)',
              boxShadow: selected === opt.id ? '0 0 10px rgba(246,216,96,0.5)' : 'none',
              color: opt.id === 'minimal' || opt.id === 'magazine' ? '#333' : '#fff',
            }}
          >
            {opt.icon}
          </div>
          <span
            className="text-[10px] tracking-wide"
            style={{
              color: selected === opt.id ? '#F6D860' : 'rgba(255,255,255,0.5)',
              fontWeight: selected === opt.id ? 700 : 400,
            }}
          >
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Watermark (shared)
// ─────────────────────────────────────────────────────────────

function Watermark({ dark = true }: { dark?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: `1px solid ${dark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '18px' }}>🎾</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: dark ? '#F6D860' : '#2D6A4F', letterSpacing: '0.05em' }}>
          AceTrip
        </span>
      </div>
      <span style={{ fontSize: '11px', color: dark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.3)', letterSpacing: '0.04em' }}>
        acetrip.vercel.app
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Placeholder avatar (fallback when image fails)
// ─────────────────────────────────────────────────────────────

function AvatarPlaceholder({
  name,
  size,
  style: extraStyle,
}: {
  name: string;
  size: number;
  style?: React.CSSProperties;
}) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #2D6A4F 0%, #40916C 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...extraStyle,
      }}
    >
      <span style={{ fontSize: size * 0.35, fontWeight: 800, color: '#ffffff' }}>{initials}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card: Passport
// ─────────────────────────────────────────────────────────────

function PassportCard({ data }: { data: NonNullable<ShareCardProps['passportData']> }) {
  const unlockedAchievements = data.achievements.filter((a) => a.unlocked).slice(0, 6);
  const stamps = data.stamps.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(246,216,96,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>
          Tennis Passport
        </p>
        <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#F6D860', margin: 0 }}>
          🎾 AceTrip Tennis Passport
        </h2>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>
          每一枚印章，都是一段故事
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0', background: 'rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 0', marginBottom: '20px' }}>
        {[
          { label: '已打卡', value: data.completedCount, gold: true },
          { label: '心愿站', value: data.pendingCount, gold: false },
          { label: '足迹国家', value: data.countries, gold: true },
        ].map((stat, i) => (
          <div key={stat.label} style={{ flex: 1, textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none' }}>
            <div style={{ fontSize: '28px', fontWeight: 800, color: stat.gold ? '#F6D860' : '#ffffff', lineHeight: 1.1 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {stamps.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase' }}>足迹印章</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {stamps.map((stamp, i) => (
              <div key={i} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '1.5px solid rgba(246,216,96,0.5)', background: 'rgba(246,216,96,0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#F6D860', lineHeight: 1.2, textAlign: 'center', maxWidth: '44px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{stamp.name.slice(0, 4)}</span>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.2, marginTop: '1px', textAlign: 'center' }}>{stamp.city.slice(0, 4)}</span>
                <span style={{ fontSize: '7px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.2 }}>{stamp.yearMonth}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {unlockedAchievements.length > 0 && (
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase' }}>已解锁成就 · {unlockedAchievements.length}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {unlockedAchievements.map((ach, i) => (
              <div key={i} style={{ background: 'rgba(246,216,96,0.18)', border: '1px solid rgba(246,216,96,0.35)', borderRadius: '10px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px' }}>{ach.emoji}</span>
                <span style={{ fontSize: '11px', color: '#F6D860', fontWeight: 600 }}>{ach.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Watermark />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card: Check-in
// ─────────────────────────────────────────────────────────────

function CheckinCard({ data }: { data: NonNullable<ShareCardProps['checkinData']> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(246,216,96,0.2)', border: '1px solid rgba(246,216,96,0.5)', borderRadius: '20px', padding: '5px 14px', marginBottom: '24px' }}>
        <span style={{ fontSize: '12px', color: '#F6D860', fontWeight: 600, letterSpacing: '0.08em' }}>{getLevelLabel(data.level)}</span>
      </div>
      <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', textAlign: 'center', lineHeight: 1.2, marginBottom: '12px', maxWidth: '280px' }}>{data.tournamentName}</h2>
      <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.65)', marginBottom: '8px', textAlign: 'center' }}>{data.city} · {data.country}</p>
      <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '10px 24px', marginBottom: '16px', marginTop: '8px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#F6D860' }}>📍 我在现场</span>
      </div>
      <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)', marginBottom: '8px' }}>
        {data.surface === 'Hard' ? '硬地' : data.surface === 'Clay' ? '红土' : data.surface === 'Grass' ? '草地' : data.surface}
      </p>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.05em' }}>{data.date}</p>
      <Watermark />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Card: Season
// ─────────────────────────────────────────────────────────────

function SeasonCard({ data }: { data: NonNullable<ShareCardProps['seasonData']> }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '11px', letterSpacing: '0.2em', color: 'rgba(246,216,96,0.7)', marginBottom: '6px', textTransform: 'uppercase' }}>My Season</p>
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#F6D860', margin: 0 }}>2026 Season Recap</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
        {[
          { icon: '🎾', label: '总打卡站数', value: data.totalCheckins, color: '#F6D860' },
          { icon: '🌍', label: '足迹国家数', value: data.countries, color: '#ffffff' },
        ].map((item) => (
          <div key={item.label} style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>{item.icon} {item.label}</span>
            <span style={{ fontSize: '32px', fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</span>
          </div>
        ))}
        {data.favoritePlayer && (
          <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>⭐ 最爱球员</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#F6D860', maxWidth: '140px', textAlign: 'right' }}>{data.favoritePlayer}</span>
          </div>
        )}
      </div>
      {data.achievements.length > 0 && (
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '10px', letterSpacing: '0.15em', color: 'rgba(255,255,255,0.4)', marginBottom: '10px', textTransform: 'uppercase' }}>本赛季成就</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {data.achievements.slice(0, 4).map((ach, i) => (
              <div key={i} style={{ background: 'rgba(246,216,96,0.15)', border: '1px solid rgba(246,216,96,0.3)', borderRadius: '10px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ fontSize: '14px' }}>{ach.emoji}</span>
                <span style={{ fontSize: '11px', color: '#F6D860', fontWeight: 600 }}>{ach.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <Watermark />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Player Card: Style 1 — Classic
// ─────────────────────────────────────────────────────────────

function PlayerCardClassic({
  data,
  headshotBase64,
}: {
  data: NonNullable<ShareCardProps['playerData']>;
  headshotBase64: string;
}) {
  const imgSrc = headshotBase64 || data.headshot;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      {/* Headshot */}
      <div style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #F6D860', overflow: 'hidden', marginBottom: '18px', flexShrink: 0, background: 'rgba(255,255,255,0.1)' }}>
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <div style={{ width: '100%', height: '100%', backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center top', borderRadius: 'inherit' }} />
        ) : (
          <AvatarPlaceholder name={data.nameEn} size={100} />
        )}
      </div>

      {/* Name */}
      <h2 style={{ fontSize: '30px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0', textAlign: 'center' }}>{data.nameCn}</h2>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '18px', textAlign: 'center' }}>{data.nameEn}</p>

      {/* Rank + Points */}
      <div style={{ display: 'flex', gap: '28px', marginBottom: '16px', background: 'rgba(255,255,255,0.07)', borderRadius: '16px', padding: '14px 32px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#F6D860', lineHeight: 1 }}>#{data.rank}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>世界排名</div>
        </div>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.15)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ffffff', lineHeight: 1 }}>{data.points.toLocaleString()}</div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', marginTop: '4px' }}>积分</div>
        </div>
      </div>

      {/* Country */}
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', marginBottom: '14px' }}>{data.countryFlag} {data.country}</p>

      {/* Season stats */}
      <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: '12px', padding: '10px 24px', marginBottom: '12px' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
          {data.wins}胜 {data.losses}负{data.titles > 0 ? ` · ${data.titles}冠` : ''}
        </span>
      </div>

      <p style={{ fontSize: '12px', color: 'rgba(246,216,96,0.7)', letterSpacing: '0.05em' }}>我关注的球员</p>

      <Watermark />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Player Card: Style 2 — Magazine
// ─────────────────────────────────────────────────────────────

function PlayerCardMagazine({
  data,
  headshotBase64,
}: {
  data: NonNullable<ShareCardProps['playerData']>;
  headshotBase64: string;
}) {
  const imgSrc = headshotBase64 || data.headshot;
  return (
    <div style={{ display: 'flex', height: '100%', minHeight: '500px' }}>
      {/* Left — photo */}
      <div style={{ width: '46%', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <div style={{ width: '100%', height: '100%', backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'top center' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #2D6A4F, #1B4332)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '64px', fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>
              {data.nameEn.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
            </span>
          </div>
        )}
        {/* Clean edge divider */}
        <div style={{ position: 'absolute', top: 0, right: 0, width: '2px', height: '100%', background: '#f5f5f0' }} />
      </div>

      {/* Right — content */}
      <div style={{ flex: 1, padding: '28px 24px 24px 16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        {/* Watermark rank number */}
        <div style={{ position: 'absolute', bottom: '60px', right: '10px', fontSize: '120px', fontWeight: 900, color: 'rgba(0,0,0,0.05)', lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>
          {data.rank}
        </div>

        {/* Top section */}
        <div>
          <p style={{ fontSize: '9px', letterSpacing: '0.3em', color: '#2D6A4F', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 600 }}>
            WTA · 我关注的球员
          </p>
          <h2 style={{ fontSize: '26px', fontWeight: 900, color: '#111111', lineHeight: 1.1, marginBottom: '6px' }}>{data.nameCn}</h2>
          <p style={{ fontSize: '12px', color: '#888888', letterSpacing: '0.05em', marginBottom: '20px' }}>{data.nameEn}</p>

          {/* Rank highlight */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '6px' }}>
            <span style={{ fontSize: '48px', fontWeight: 900, color: '#111111', lineHeight: 1 }}>#{data.rank}</span>
          </div>
          <p style={{ fontSize: '10px', color: '#aaaaaa', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>世界排名</p>

          {/* Divider */}
          <div style={{ width: '32px', height: '2px', background: '#2D6A4F', marginBottom: '16px' }} />

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#aaaaaa', textTransform: 'uppercase' }}>积分</span>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#2D6A4F' }}>{data.points.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#aaaaaa', textTransform: 'uppercase' }}>战绩</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#333333' }}>{data.wins}W / {data.losses}L</span>
            </div>
            {data.titles > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#aaaaaa', textTransform: 'uppercase' }}>冠军</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#C9A84C' }}>{data.titles}🏆</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#aaaaaa', textTransform: 'uppercase' }}>国籍</span>
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#333333' }}>{data.countryFlag} {data.country}</span>
            </div>
          </div>
        </div>

        {/* Bottom watermark */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid rgba(0,0,0,0.08)', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '16px' }}>🎾</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#2D6A4F', letterSpacing: '0.05em' }}>AceTrip</span>
          </div>
          <span style={{ fontSize: '10px', color: 'rgba(0,0,0,0.3)', letterSpacing: '0.04em' }}>acetrip.vercel.app</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Player Card: Style 3 — Neon
// ─────────────────────────────────────────────────────────────

function PlayerCardNeon({
  data,
  headshotBase64,
}: {
  data: NonNullable<ShareCardProps['playerData']>;
  headshotBase64: string;
}) {
  const imgSrc = headshotBase64 || data.headshot;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      {/* Glow circle avatar */}
      <div style={{ width: '108px', height: '108px', borderRadius: '50%', overflow: 'hidden', marginBottom: '20px', flexShrink: 0, boxShadow: '0 0 30px rgba(45,106,79,0.6), 0 0 60px rgba(45,106,79,0.2)', border: '2px solid rgba(45,106,79,0.8)' }}>
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <div style={{ width: '100%', height: '100%', backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center top', borderRadius: 'inherit' }} />
        ) : (
          <AvatarPlaceholder name={data.nameEn} size={108} />
        )}
      </div>

      {/* Gradient name */}
      <h2 style={{ fontSize: '30px', fontWeight: 900, margin: '0 0 4px 0', textAlign: 'center', background: 'linear-gradient(135deg, #52d68a 0%, #40e0d0 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
        {data.nameCn}
      </h2>
      <p style={{ fontSize: '12px', color: 'rgba(82,214,138,0.5)', marginBottom: '22px', letterSpacing: '0.08em' }}>{data.nameEn}</p>

      {/* Neon rank badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '18px' }}>
        <div style={{ textAlign: 'center', background: 'rgba(45,106,79,0.2)', border: '1px solid rgba(45,106,79,0.5)', borderRadius: '14px', padding: '12px 20px', boxShadow: '0 0 12px rgba(45,106,79,0.3)' }}>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#52d68a', lineHeight: 1 }}>#{data.rank}</div>
          <div style={{ fontSize: '9px', color: 'rgba(82,214,138,0.5)', marginTop: '4px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>RANK</div>
        </div>
        <div style={{ textAlign: 'center', background: 'rgba(45,106,79,0.2)', border: '1px solid rgba(45,106,79,0.5)', borderRadius: '14px', padding: '12px 20px', boxShadow: '0 0 12px rgba(45,106,79,0.3)' }}>
          <div style={{ fontSize: '22px', fontWeight: 900, color: '#40e0d0', lineHeight: 1 }}>{data.points.toLocaleString()}</div>
          <div style={{ fontSize: '9px', color: 'rgba(64,224,208,0.5)', marginTop: '4px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>PTS</div>
        </div>
      </div>

      {/* Country */}
      <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '14px' }}>{data.countryFlag} {data.country}</p>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
        {[
          { label: 'W', value: data.wins, color: '#52d68a' },
          { label: 'L', value: data.losses, color: '#ff6b6b' },
          ...(data.titles > 0 ? [{ label: '🏆', value: data.titles, color: '#F6D860' }] : []),
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '8px 16px', textAlign: 'center' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Bottom label */}
      <p style={{ fontSize: '10px', color: 'rgba(82,214,138,0.4)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>我关注的球员</p>

      {/* Watermark */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginTop: '20px', paddingTop: '14px', borderTop: '1px solid rgba(45,106,79,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>🎾</span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#52d68a', letterSpacing: '0.05em' }}>AceTrip</span>
        </div>
        <span style={{ fontSize: '10px', color: 'rgba(82,214,138,0.3)', letterSpacing: '0.04em' }}>acetrip.vercel.app</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Player Card: Style 4 — Minimal
// ─────────────────────────────────────────────────────────────

function PlayerCardMinimal({
  data,
  headshotBase64,
}: {
  data: NonNullable<ShareCardProps['playerData']>;
  headshotBase64: string;
}) {
  const imgSrc = headshotBase64 || data.headshot;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', color: '#111111' }}>
      {/* Top row: small avatar + name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '36px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(45,106,79,0.3)' }}>
          {imgSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <div style={{ width: '100%', height: '100%', backgroundImage: `url(${imgSrc})`, backgroundSize: 'cover', backgroundPosition: 'center top', borderRadius: 'inherit' }} />
          ) : (
            <AvatarPlaceholder name={data.nameEn} size={52} />
          )}
        </div>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#111111', margin: 0, lineHeight: 1.2 }}>{data.nameCn}</h2>
          <p style={{ fontSize: '11px', color: '#999999', margin: '3px 0 0', letterSpacing: '0.03em' }}>{data.nameEn}</p>
        </div>
      </div>

      {/* Large rank */}
      <div style={{ marginBottom: '8px' }}>
        <span style={{ fontSize: '72px', fontWeight: 900, color: '#111111', lineHeight: 1 }}>#{data.rank}</span>
      </div>
      <p style={{ fontSize: '11px', color: '#aaaaaa', letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: '32px' }}>世界排名</p>

      {/* Thin divider */}
      <div style={{ width: '100%', height: '1px', background: '#e8e8e8', marginBottom: '24px' }} />

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'POINTS', value: data.points.toLocaleString(), accent: true },
          { label: 'COUNTRY', value: `${data.countryFlag} ${data.country}`, accent: false },
          { label: 'WINS / LOSSES', value: `${data.wins} / ${data.losses}`, accent: false },
          ...(data.titles > 0 ? [{ label: 'TITLES', value: `${data.titles} 🏆`, accent: true }] : [{ label: 'SEASON', value: '2026', accent: false }]),
        ].map((s) => (
          <div key={s.label}>
            <p style={{ fontSize: '9px', letterSpacing: '0.2em', color: '#cccccc', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</p>
            <p style={{ fontSize: '16px', fontWeight: 600, color: s.accent ? '#2D6A4F' : '#333333', margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Bottom note + watermark */}
      <div style={{ marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '10px', color: '#cccccc', letterSpacing: '0.15em', textTransform: 'uppercase' }}>我关注的球员</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>🎾</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#2D6A4F', letterSpacing: '0.04em' }}>AceTrip</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main ShareCard component
// ─────────────────────────────────────────────────────────────

export function ShareCard({ mode, onClose, passportData, checkinData, seasonData, playerData }: ShareCardProps) {
  const [saving, setSaving] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardStyle, setCardStyle] = useState<CardStyle>('classic');
  

  // Use proxy URL for headshot to avoid CORS issues with html2canvas
  const proxyHeadshot = playerData?.headshot 
    ? `/api/proxy-image?url=${encodeURIComponent(playerData.headshot)}` 
    : '';

  // Card background / wrapper styles per style variant
  const getCardWrapperStyle = (): React.CSSProperties => {
    switch (cardStyle) {
      case 'classic':
        return {
          background: 'linear-gradient(160deg, #1B4332 0%, #2D6A4F 55%, #1a3d2b 100%)',
          borderRadius: '24px',
          padding: '32px',
        };
      case 'magazine':
        return {
          background: '#f5f5f0',
          borderRadius: '24px',
          padding: '0',
          overflow: 'hidden',
        };
      case 'neon':
        return {
          background: '#0a0a0a',
          borderRadius: '24px',
          padding: '32px',
        };
      case 'minimal':
        return {
          background: '#ffffff',
          borderRadius: '24px',
          padding: '36px',
          border: '1px solid #f0f0f0',
        };
    }
  };

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = `acetrip-${mode}-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setSaving(false);
    }
  };

  // Non-player modes keep classic dark look; player gets style variants
  const isPlayerMode = mode === 'player';

  const darkOverlay = !isPlayerMode || cardStyle === 'classic' || cardStyle === 'neon';

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center px-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Style picker — only for player mode */}
      {isPlayerMode && (
        <StylePicker options={STYLE_OPTIONS} selected={cardStyle} onChange={setCardStyle} />
      )}

      {/* Card preview */}
      <div
        ref={cardRef}
        style={{
          width: '375px',
          minHeight: '500px',
          boxSizing: 'border-box',
          position: 'relative',
          flexShrink: 0,
          ...(isPlayerMode
            ? getCardWrapperStyle()
            : {
                background: 'linear-gradient(160deg, #1B4332 0%, #2D6A4F 55%, #1a3d2b 100%)',
                borderRadius: '24px',
                padding: '32px',
                overflow: 'hidden',
              }),
        }}
      >
        {/* Decorative gloss (classic / neon / non-player) */}
        {(cardStyle === 'classic' || cardStyle === 'neon' || !isPlayerMode) && (
          <>
            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '220px', height: '220px', borderRadius: '50%', background: cardStyle === 'neon' ? 'radial-gradient(circle, rgba(45,106,79,0.12) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(246,216,96,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 0, left: '-30%', width: '60%', height: '100%', background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.04) 50%, transparent 60%)', pointerEvents: 'none', zIndex: 1 }} />
          </>
        )}

        {/* Inner content */}
        <div style={{ position: 'relative', zIndex: 2, height: '100%' }}>
          {mode === 'passport' && passportData && <PassportCard data={passportData} />}
          {mode === 'checkin' && checkinData && <CheckinCard data={checkinData} />}
          {mode === 'season' && seasonData && <SeasonCard data={seasonData} />}
          {mode === 'player' && playerData && (
            <>
              {cardStyle === 'classic' && <PlayerCardClassic data={playerData} headshotBase64={proxyHeadshot} />}
              {cardStyle === 'magazine' && <PlayerCardMagazine data={playerData} headshotBase64={proxyHeadshot} />}
              {cardStyle === 'neon' && <PlayerCardNeon data={playerData} headshotBase64={proxyHeadshot} />}
              {cardStyle === 'minimal' && <PlayerCardMinimal data={playerData} headshotBase64={proxyHeadshot} />}
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-5">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all"
          style={{ background: saving ? '#6b7280' : 'linear-gradient(135deg, #2D6A4F, #40916C)' }}
        >
          <Download size={15} />
          {saving ? '生成中…' : '保存图片'}
        </button>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold bg-white/15 text-white transition-all hover:bg-white/25"
        >
          <X size={15} />
          关闭
        </button>
      </div>

      <p className="text-white/40 text-xs mt-3">点击遮罩关闭</p>
    </div>
  );
}

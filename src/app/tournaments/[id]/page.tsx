import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAllTournaments, getTournamentById, formatDateRange, LEVEL_LABELS, getCountryFlag } from '@/lib/data';
import { createSeoMetadata } from '@/lib/seo';
import { TournamentDetailClient } from '@/components/tournaments/TournamentDetailClient';
import { ArrowLeft, MapPin, Calendar, Users, Landmark } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return getAllTournaments().map(t => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const tournament = getTournamentById(id);
  if (!tournament) return { title: '赛事未找到 | AceTrip' };

  const name = tournament.nameCn || tournament.name;
  const description = `${name} 签表与赛事信息：${LEVEL_LABELS[tournament.level]}，${tournament.cityCn || tournament.city}，${tournament.countryCn || tournament.countryName}，${formatDateRange(tournament.dateStart, tournament.dateEnd)}。`;

  return createSeoMetadata({
    title: `${name} 签表 | AceTrip`,
    description,
    path: `/tournaments/${tournament.id}`,
  });
}

const SURFACE_BG: Record<string, string> = {
  Hard: 'from-[#2D6A4F] to-[#1B4332]',
  Clay: 'from-[#8B5E3C] to-[#5C3D2E]',
  Grass: 'from-[#3A7D44] to-[#2D5F33]',
};

const SURFACE_CN: Record<string, string> = {
  Hard: '硬地',
  Clay: '红土',
  Grass: '草地',
};

export default async function TournamentPage({ params }: Props) {
  const { id } = await params;
  const tournament = getTournamentById(id);
  if (!tournament) notFound();

  const now = new Date();
  const start = new Date(tournament.dateStart);
  const end = new Date(tournament.dateEnd);
  const status = now < start ? 'upcoming' : now > end ? 'completed' : 'ongoing';
  const daysUntil = now < start ? Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <div className="animate-fade-in">
      {/* Back nav */}
      <div className="container-tight pt-4">
        <Link href="/tournaments" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <ArrowLeft size={16} />
          返回赛事列表
        </Link>
      </div>

      {/* Hero */}
      <div className="container-tight pt-6 pb-8 md:pt-8 md:pb-12">
        <div className={`rounded-2xl bg-gradient-to-br ${SURFACE_BG[tournament.surface] || 'from-gray-600 to-gray-800'} p-6 md:p-10 text-white mb-8`}>
          {/* Level badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white/90 text-xs font-medium mb-4 backdrop-blur">
            {LEVEL_LABELS[tournament.level]} · {SURFACE_CN[tournament.surface] || tournament.surface}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{tournament.nameCn || tournament.name}</h1>
          {tournament.nameCn && <p className="text-sm text-white/60 mt-1">{tournament.name}</p>}

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-sm text-white/70">
            <span className="flex items-center gap-1.5">
              <MapPin size={14} /> {tournament.cityCn || tournament.city}，{tournament.countryCn || tournament.countryName} {getCountryFlag(tournament.country)}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} /> {formatDateRange(tournament.dateStart, tournament.dateEnd)}
            </span>
            <span className="flex items-center gap-1.5">
              <Users size={14} /> 签表：{tournament.drawSize} 人
            </span>
            {tournament.indoor && (
              <span className="flex items-center gap-1.5">
                <Landmark size={14} /> 室内
              </span>
            )}
            {(tournament.timezoneCn || tournament.timezone) && (
              <span className="flex items-center gap-1.5">
                🕐 {tournament.timezoneCn || tournament.timezone.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Status */}
          <div className="mt-6">
            {status === 'upcoming' && daysUntil !== null && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm">
                ⏳ 距开赛还有 {daysUntil} 天
              </div>
            )}
            {status === 'ongoing' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                比赛进行中
              </div>
            )}
            {status === 'completed' && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-sm">
                ✅ 赛事已结束
              </div>
            )}
          </div>

          {/* Winner */}
          {status === 'completed' && tournament.winner && (
            <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 backdrop-blur">
              {tournament.winner.headshot ? (
                <img
                  src={tournament.winner.headshot}
                  alt={tournament.winner.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/60"
                />
              ) : (
                <span className="text-2xl">🏆</span>
              )}
              <div>
                <div className="text-xs text-white/50 flex items-center gap-1">🏆 本站冠军</div>
                <div className="text-base font-semibold text-white">
                  {tournament.winner.nameCn || tournament.winner.name}
                  {tournament.winner.nameCn && (
                    <span className="text-sm font-normal text-white/60 ml-1.5">{tournament.winner.name}</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Venue info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <InfoCard icon="🏟" label="场馆" value={tournament.venue} />
          {tournament.prizeMoney && <InfoCard icon="💰" label="总奖金" value={tournament.prizeMoney} />}
          <InfoCard icon="🎾" label="场地" value={`${SURFACE_CN[tournament.surface] || tournament.surface}${tournament.indoor ? ' · 室内' : ''}`} />
        </div>
      </div>

      {/* Client interactive section */}
      <TournamentDetailClient tournament={tournament} />
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="card-flat p-4">
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
          <div className="text-sm font-medium mt-0.5">{value}</div>
        </div>
      </div>
    </div>
  );
}

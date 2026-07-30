/**
 * 构建时数据刷新脚本
 * 从 WTA 官方 API 拉取最新排名和赛事冠军数据
 * 
 * 用法：npm run fetch-data（在 build 之前运行）
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

async function fetchJSON(url) {
  const resp = await fetch(url, {
    headers: { 'Accept': 'application/json' },
  });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${url}`);
  return resp.json();
}

async function updateRankings() {
  console.log('📊 正在更新 WTA 排名...');
  
  const playersPath = path.join(DATA_DIR, 'players_final.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  try {
    // ESPN API 获取最新排名
    const espnData = await fetchJSON(
      'https://site.api.espn.com/apis/site/v2/sports/tennis/wta/rankings'
    );
    
    const ranks = espnData.rankings[0].ranks;
    const rankMap = {};
    for (const r of ranks) {
      rankMap[r.athlete.id] = {
        rank: r.current,
        previousRank: r.previous,
        points: r.points,
      };
    }
    
    let updated = 0;
    for (const p of playersData.players) {
      const espnRank = rankMap[p.espnId];
      if (espnRank) {
        p.previousRank = p.rank;
        p.rank = espnRank.rank;
        p.points = espnRank.points;
        updated++;
      }
    }
    
    // 按排名重新排序
    playersData.players.sort((a, b) => a.rank - b.rank);
    playersData.updateTime = new Date().toISOString();
    
    fs.writeFileSync(playersPath, JSON.stringify(playersData, null, 2));
    console.log(`  ✅ 更新了 ${updated} 个球员的排名`);
  } catch (e) {
    console.error(`  ❌ 排名更新失败: ${e.message}`);
  }
}

async function updateTournamentWinners() {
  console.log('🏆 正在更新赛事冠军...');
  
  const tournamentsPath = path.join(DATA_DIR, 'tournaments_2026.json');
  const tournamentsData = JSON.parse(fs.readFileSync(tournamentsPath, 'utf-8'));
  
  const playersPath = path.join(DATA_DIR, 'players_final.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  
  // 球员中文名映射
  const cnMap = {};
  for (const p of playersData.players) {
    cnMap[p.displayName.toLowerCase()] = p.nameCn || '';
  }
  
  try {
    const year = new Date().getFullYear();
    const today = new Date().toISOString().split('T')[0];
    const wtaData = await fetchJSON(
      `https://api.wtatennis.com/tennis/tournaments/?page=0&pageSize=200&excludeLevels=ITF&from=${year}-01-01&to=${today}&updates=true`
    );
    
    // WTA 赛事名 → 冠军映射
    const winnerMap = {};
    for (const t of wtaData.content) {
      const level = t.level || '';
      if (['Grand Slam', 'WTA 1000', 'WTA 500'].includes(level)) {
        const winners = t.winners || [];
        if (winners.length > 0) {
          const singles = winners[0].singles;
          if (singles && singles.player) {
            winnerMap[t.tournamentGroup.name.trim().toUpperCase()] = {
              name: singles.player.fullName,
              countryCode: singles.player.countryCode,
            };
          }
        }
      }
    }
    
    // 赛事 ID → WTA 名称映射
    const idToWta = {
      "united-cup": "UNITED CUP", "brisbane": "BRISBANE", "adelaide": "ADELAIDE",
      "australian-open": "AUSTRALIAN OPEN", "abu-dhabi": "ABU DHABI",
      "qatar-open": "DOHA", "dubai-championships": "DUBAI", "merida": "MÉRIDA",
      "indian-wells": "INDIAN WELLS", "miami-open": "MIAMI",
      "charleston": "CHARLESTON", "linz": "LINZ", "stuttgart": "STUTTGART",
      "madrid-open": "MADRID", "rome": "ROME", "strasbourg": "STRASBOURG",
      "roland-garros": "ROLAND GARROS", "queens": "QUEENS", "berlin": "BERLIN",
      "bad-homburg": "BAD HOMBURG", "wimbledon": "WIMBLEDON",
      "washington-dc": "WASHINGTON DC", "national-bank-open": "TORONTO",
      "cincinnati-open": "CINCINNATI", "monterrey": "MONTERREY",
      "us-open": "US OPEN", "guadalajara": "GUADALAJARA",
      "singapore-open": "SINGAPORE", "china-open": "CHINA OPEN",
      "wuhan-open": "WUHAN", "ningbo-open": "NINGBO",
      "toray-pan-pacific": "TOKYO", "wta-finals": "WTA FINALS",
    };
    
    let updated = 0;
    for (const t of tournamentsData.tournaments) {
      const wtaName = (idToWta[t.id] || '').toUpperCase();
      if (wtaName && winnerMap[wtaName]) {
        const w = winnerMap[wtaName];
        const cn = cnMap[w.name.toLowerCase()] || '';
        t.winner = {
          name: w.name,
          nameCn: cn,
          countryCode: w.countryCode,
        };
        updated++;
      }
    }
    
    fs.writeFileSync(tournamentsPath, JSON.stringify(tournamentsData, null, 2));
    console.log(`  ✅ 更新了 ${updated} 个赛事的冠军`);
  } catch (e) {
    console.error(`  ❌ 冠军更新失败: ${e.message}`);
  }
}

async function updatePlayerSchedules() {
  console.log('\n🎾 正在更新球员参赛记录...');
  
  const playersPath = path.join(DATA_DIR, 'players_final.json');
  const playersData = JSON.parse(fs.readFileSync(playersPath, 'utf-8'));
  const schedulePath = path.join(DATA_DIR, 'player_schedule.json');
  
  let existingSchedule = {};
  try {
    existingSchedule = JSON.parse(fs.readFileSync(schedulePath, 'utf-8'));
  } catch(e) {}
  
  const ROUND_ORDER = { 'R128': 1, 'R64': 2, 'R32': 3, 'R16': 4, 'Q': 5, 'S': 6, 'F': 7 };
  
  const NAME_TO_ID = {
    'BRISBANE': 'brisbane', 'ADELAIDE': 'adelaide', 'AUSTRALIAN OPEN': 'australian-open',
    'ABU DHABI': 'abu-dhabi', 'DOHA': 'qatar-open', 'DUBAI': 'dubai-championships',
    'M\u00c9RIDA': 'merida', 'MERIDA': 'merida', 'INDIAN WELLS': 'indian-wells',
    'MIAMI': 'miami-open', 'CHARLESTON': 'charleston', 'LINZ': 'linz',
    'STUTTGART': 'stuttgart', 'MADRID': 'madrid-open', 'ROME': 'rome',
    'STRASBOURG': 'strasbourg', 'ROLAND GARROS': 'roland-garros',
    "QUEEN'S CLUB": 'queens', 'EASTBOURNE': 'queens', 'BERLIN': 'berlin',
    'BAD HOMBURG': 'bad-homburg', 'WIMBLEDON': 'wimbledon',
    'WASHINGTON': 'washington-dc', 'TORONTO': 'national-bank-open',
    'CINCINNATI': 'cincinnati-open', 'MONTERREY': 'monterrey',
    'US OPEN': 'us-open', 'GUADALAJARA': 'guadalajara',
    'SINGAPORE': 'singapore-open', 'CHINA OPEN': 'china-open',
    'BEIJING': 'china-open', 'WUHAN': 'wuhan-open',
    'NINGBO': 'ningbo-open', 'TOKYO': 'toray-pan-pacific',
    'WTA FINALS': 'wta-finals', 'UNITED CUP': 'united-cup',
    'AUCKLAND': 'adelaide', // Auckland → closest match
  };
  
  // 只更新有 wtaId 的球员
  const featuredPlayers = playersData.players.filter(p => p.wtaId);
  let updated = 0;
  
  for (const player of featuredPlayers) {
    try {
      const year = new Date().getFullYear();
      const prevYear = year - 1;
      
      // 拉取当年 + 去年两年数据（52周积分需要跨年）
      const [dataThisYear, dataLastYear] = await Promise.all([
        fetchJSON(`https://api.wtatennis.com/tennis/players/${player.wtaId}/matches?year=${year}&page=0&pageSize=200`),
        fetchJSON(`https://api.wtatennis.com/tennis/players/${player.wtaId}/matches?year=${prevYear}&page=0&pageSize=200`),
      ]);
      
      const allMatchesThisYear = (dataThisYear.matches || dataThisYear.content || []).filter(m => m.s_d_flag === 'S' && m.reason_code !== 'B');
      const allMatchesLastYear = (dataLastYear.matches || dataLastYear.content || []).filter(m => m.s_d_flag === 'S' && m.reason_code !== 'B');
      
      // 52周前的日期
      const now = new Date();
      const fiftyTwoWeeksAgo = new Date(now.getTime() - 52 * 7 * 24 * 60 * 60 * 1000);
      
      // 合并两年数据，只保留52周内的
      const allMatches = [...allMatchesThisYear, ...allMatchesLastYear];
      const matches = allMatches.filter(m => {
        const startDate = new Date(m.StartDate || '');
        return startDate >= fiftyTwoWeeksAgo;
      });
      
      // 按赛事分组
      const tournamentMap = {};
      for (const m of matches) {
        const name = (m.TournamentName || '').trim();
        if (!name) continue;
        if (!tournamentMap[name]) {
          tournamentMap[name] = {
            name: name,
            startDate: m.StartDate || '',
            bestRound: '',
            bestRoundOrder: 0,
            isChampion: false,
            wins: 0,
            losses: 0,
            points: 0,
            level: m.TournamentLevel || '',
          };
        }
        const t = tournamentMap[name];
        const round = m.round_name || '';
        const roundOrder = ROUND_ORDER[round] || 0;
        if (roundOrder > t.bestRoundOrder) {
          t.bestRound = round;
          t.bestRoundOrder = roundOrder;
        }
        if (m.winner === 1) {
          t.wins++;
          if (round === 'F') t.isChampion = true;
        } else {
          t.losses++;
        }
      }
      
      const tournaments = Object.values(tournamentMap);
      const tournamentIds = [];
      const results = [];
      
      for (const t of tournaments) {
        const nameUpper = t.name.toUpperCase();
        let tid = NAME_TO_ID[nameUpper];
        if (!tid) {
          for (const [key, val] of Object.entries(NAME_TO_ID)) {
            if (nameUpper.includes(key) || key.includes(nameUpper)) {
              tid = val;
              break;
            }
          }
        }
        if (tid) tournamentIds.push(tid);
        // 获取积分：取该赛事所有比赛中 points_1 的值（每场都一样）
        const tournamentMatches = matches.filter(m => (m.TournamentName || '').trim() === t.name);
        let pts = 0;
        for (const m of tournamentMatches) {
          if (m.points_1 && m.points_1 > pts) pts = m.points_1;
        }
        
        results.push({
          name: t.name,
          startDate: t.startDate,
          bestRound: t.bestRound,
          isChampion: t.isChampion,
          tournamentId: tid || null,
          points: pts,
          level: t.level,
        });
      }
      
      // 分开统计当年和全部的胜负
      const curYear = new Date().getFullYear();
      const thisYearTournaments = tournaments.filter(t => t.startDate && new Date(t.startDate).getFullYear() === curYear);
      const allWins = tournaments.reduce((s, t) => s + t.wins, 0);
      const allLosses = tournaments.reduce((s, t) => s + t.losses, 0);
      const thisYearWins = thisYearTournaments.reduce((s, t) => s + t.wins, 0);
      const thisYearLosses = thisYearTournaments.reduce((s, t) => s + t.losses, 0);
      
      existingSchedule[player.id] = {
        tournamentIds: tournamentIds,
        totalTournaments: tournaments.length,
        totalWins: allWins,
        totalLosses: allLosses,
        titles: tournaments.filter(t => t.isChampion).length,
        thisYearTournaments: thisYearTournaments.length,
        thisYearWins: thisYearWins,
        thisYearLosses: thisYearLosses,
        thisYearTitles: thisYearTournaments.filter(t => t.isChampion).length,
        results: results,
      };
      updated++;
    } catch (e) {
      // 保留旧数据
    }
    
    // 礼貌性延迟
    await new Promise(r => setTimeout(r, 300));
  }
  
  fs.writeFileSync(schedulePath, JSON.stringify(existingSchedule, null, 2));
  console.log(`  ✅ 更新了 ${updated} 个球员的参赛记录`);
}

async function updatePointsBreakdown() {
  console.log('\n💰 正在更新球员积分明细（live-tennis.cn）...');
  const playersPath = path.join(__dirname, '..', 'data', 'players_final.json');
  const breakdownPath = path.join(__dirname, '..', 'data', 'player_points_breakdown.json');
  const players = JSON.parse(fs.readFileSync(playersPath, 'utf8')).players;
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(breakdownPath, 'utf8')); } catch {}
  
  let updated = 0;
  for (const player of players) {
    if (!player.wtaId) continue;
    try {
      const html = await fetchText(`https://www.live-tennis.cn/en/breakdown/wta/s/year/query?id=${player.wtaId}`);
      
      // 提取总积分
      const totalMatch = html.match(/name:\s*"Total"\s*,\s*value:\s*(\d+)/);
      const total = totalMatch ? parseInt(totalMatch[1]) : 0;
      
      // 提取积分表格
      const tableMatch = html.match(/id=iBreakdownContentLevelTable[^>]*>(.*?)<\/table>/s);
      if (!tableMatch) { await new Promise(r => setTimeout(r, 200)); continue; }
      
      const entries = [];
      let currentLevel = '';
      const LEVEL_MAP = { 'WTA YEC': 'WTA Finals', 'W1000': 'WTA 1000', 'W500': 'WTA 500', 'W250': 'WTA 250' };
      const rows = tableMatch[1].matchAll(/<tr[^>]*>(.*?)<\/tr>/gs);
      for (const row of rows) {
        const rowHtml = row[1];
        if (row[0].includes('cBreakdownContentTitleRow')) {
          const td = rowHtml.match(/<td[^>]*>(.*?)<\/td>/s);
          if (td) currentLevel = LEVEL_MAP[td[1].trim()] || td[1].trim();
          continue;
        }
        const tds = [...rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map(m => m[1].replace(/&[^;]+;/g, '').replace(/<[^>]+>/g, '').trim());
        if (tds.length >= 3) {
          const pts = parseInt(tds[1]) || 0;
          if (pts > 0) entries.push({ level: currentLevel, name: tds[0], points: pts, round: tds[2] });
        }
      }
      
      existing[player.id] = { total, entries };
      updated++;
    } catch {}
    await new Promise(r => setTimeout(r, 200));
  }
  
  fs.writeFileSync(breakdownPath, JSON.stringify(existing, null, 2));
  console.log(`  ✅ 更新了 ${updated} 个球员的积分明细`);
}

// fetchText helper
async function fetchText(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? require('https') : require('http');
    mod.get(url, { headers: { 'User-Agent': 'AceTrip/1.0' } }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function main() {
  console.log('🔄 AceTrip 数据刷新\n');
  await updateRankings();
  await updateTournamentWinners();
  await updatePlayerSchedules();
  await updatePointsBreakdown();
  console.log('\n✅ 数据刷新完成');
}

main().catch(console.error);

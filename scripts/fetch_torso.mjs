/**
 * Fetch WTA Torso headshots for all players with wtaId
 * Uses batches of 15 players per API call
 */
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dir = dirname(__filename);
const dataPath = join(__dir, '../data/players_final.json');

const data = JSON.parse(readFileSync(dataPath, 'utf-8'));
const players = data.players;

// Get all players with wtaId
const playersWithWta = players.filter(p => p.wtaId);
console.log(`Total players with wtaId: ${playersWithWta.length}`);

// Build a map: wtaId -> player index in players array
const wtaIdToIdx = {};
players.forEach((p, i) => {
  if (p.wtaId) wtaIdToIdx[p.wtaId] = i;
});

// Process in batches of 15
const BATCH_SIZE = 15;
const batches = [];
for (let i = 0; i < playersWithWta.length; i += BATCH_SIZE) {
  batches.push(playersWithWta.slice(i, i + BATCH_SIZE));
}

console.log(`Processing ${batches.length} batches of up to ${BATCH_SIZE} players each...`);

let totalFound = 0;
let totalMissing = 0;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
  const batch = batches[batchIdx];
  const refExpr = batch.map(p => `TENNIS_PLAYER:${p.wtaId}`).join('+or+');
  const url = `https://api.wtatennis.com/content/wta/PHOTO/en?limit=50&tagNames=player-headshot&referenceExpression=${refExpr}`;

  console.log(`\nBatch ${batchIdx + 1}/${batches.length}: players ${batchIdx * BATCH_SIZE + 1}-${batchIdx * BATCH_SIZE + batch.length}`);
  
  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      console.error(`  HTTP error ${resp.status}`);
      // Mark all as empty
      batch.forEach(p => {
        const idx = wtaIdToIdx[p.wtaId];
        if (players[idx].headshotTorso === undefined) {
          players[idx].headshotTorso = '';
        }
      });
      continue;
    }
    
    const json = await resp.json();
    const content = json.content || [];
    
    // Build a map: wtaId -> best Torso URL
    // Strategy: find title containing "Torso" for each player
    const torsoMap = {};
    
    for (const item of content) {
      if (!item.title || !item.title.toLowerCase().includes('torso')) continue;
      if (!item.onDemandUrl) continue;
      
      // Find which player this belongs to
      const refs = item.references || [];
      for (const ref of refs) {
        if (ref.type === 'TENNIS_PLAYER') {
          const wtaId = ref.id || parseInt(ref.sid);
          if (wtaId && wtaIdToIdx[wtaId] !== undefined) {
            // Keep the most recent (first occurrence since API returns sorted by date desc)
            if (!torsoMap[wtaId]) {
              torsoMap[wtaId] = item.onDemandUrl;
            }
          }
        }
      }
    }
    
    // Apply results
    for (const p of batch) {
      const idx = wtaIdToIdx[p.wtaId];
      if (torsoMap[p.wtaId]) {
        players[idx].headshotTorso = torsoMap[p.wtaId];
        totalFound++;
        console.log(`  ✓ ${p.id}: ${torsoMap[p.wtaId].substring(0, 80)}...`);
      } else {
        players[idx].headshotTorso = '';
        totalMissing++;
        console.log(`  ✗ ${p.id} (wtaId: ${p.wtaId}): no Torso found`);
      }
    }
    
  } catch (err) {
    console.error(`  Error: ${err.message}`);
    batch.forEach(p => {
      const idx = wtaIdToIdx[p.wtaId];
      if (players[idx].headshotTorso === undefined) {
        players[idx].headshotTorso = '';
      }
    });
  }
  
  // Small delay between batches to avoid rate limiting
  if (batchIdx < batches.length - 1) {
    await sleep(300);
  }
}

// Save the updated data
writeFileSync(dataPath, JSON.stringify(data, null, 2));

console.log(`\n✅ Done!`);
console.log(`   Found Torso: ${totalFound} players`);
console.log(`   Missing Torso: ${totalMissing} players`);

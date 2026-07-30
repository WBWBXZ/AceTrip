#!/usr/bin/env node
/**
 * 从 Google News RSS XML 解析 WTA 新闻，过滤/去重/翻译成中文
 * 
 * 用法：
 *   1. 先用 curl 下载 RSS：curl -sL "https://news.google.com/rss/search?q=WTA+tennis&hl=en&gl=US&ceid=US:en" > /tmp/wta_rss.xml
 *   2. node scripts/fetch-news.js /tmp/wta_rss.xml
 *   
 *   或者不传参数，脚本会自己 fetch（需网络可达 Google）
 */

const fs = require('fs');
const path = require('path');

const RSS_URL = 'https://news.google.com/rss/search?q=WTA+tennis&hl=en&gl=US&ceid=US:en';

async function getXML() {
  // 优先从命令行参数读文件
  const xmlFile = process.argv[2];
  if (xmlFile && fs.existsSync(xmlFile)) {
    console.log(`Reading RSS from file: ${xmlFile}`);
    return fs.readFileSync(xmlFile, 'utf-8');
  }
  
  // 否则直接 fetch
  console.log('Fetching RSS from Google News...');
  const res = await fetch(RSS_URL, { signal: AbortSignal.timeout(15000) });
  return await res.text();
}

function parseItems(xml) {
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title>(.*?)<\/title>/) || [])[1] || '';
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || '';
    const source = (block.match(/<source[^>]*>(.*?)<\/source>/) || [])[1] || 'WTA Tennis';
    items.push({ title: title.trim(), pubDate, source });
  }
  return items;
}

function filterNews(items) {
  return items.filter(item => {
    const t = item.title;
    if (t.includes('WTA Official')) return false;
    if (/\bvs\.\s/i.test(t)) return false;
    if (t.startsWith('Hot shot')) return false;
    if (t.startsWith('Shot of')) return false;
    return true;
  });
}

function dedup(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = item.title.substring(0, 30).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

// 球员名中英对照
const PLAYER_NAMES = {
  'Osaka': '大坂直美', 'Sabalenka': '萨巴伦卡', 'Rybakina': '莱巴金娜',
  'Swiatek': '斯瓦泰克', 'Gauff': '高芙', 'Zheng': '郑钦文',
  'Pegula': '佩古拉', 'Keys': '基斯', 'Fernandez': '费尔南德斯',
  'Navarro': '纳瓦罗', 'Cocciaretto': '科恰雷托', 'Eala': '伊拉',
  'Volynets': '沃利内茨', 'Zarazua': '萨拉苏亚', 'Osorio': '奥索里奥',
  'Venus Williams': '大威廉姆斯', 'Serena Williams': '小威廉姆斯',
  'Williams': '威廉姆斯', 'Shnaider': '什奈德', 'Krueger': '克鲁格',
  'Tang': '唐', 'Xu': '徐', 'Samsonova': '萨姆索诺娃',
  'Hunter': '亨特', 'Maria': '玛利亚', 'Kalieva': '卡利耶娃',
  'Sonmez': '索梅兹', 'Shymanovich': '希曼诺维奇',
  'Andreeva': '安德列耶娃', 'Kasatkina': '卡萨金娜',
  'Sakkari': '萨卡里', 'Badosa': '巴多萨', 'Paolini': '保利尼',
  'Haddad Maia': '哈达德·马亚', 'Muchova': '穆霍娃',
  'Alexandrova': '亚历山德罗娃', 'Jabeur': '贾巴尔',
  'Bencic': '本西奇', 'Azarenka': '阿扎伦卡', 'Kvitova': '科维托娃',
  'Pegula': '佩古拉', 'Krejcikova': '克雷吉茨科娃',
  'Vondrousova': '万卓索娃', 'Kostyuk': '科斯丘克',
  'Linette': '利内特', 'Yuan': '袁', 'Wang': '王',
};

// 赛事名翻译
const TOURNAMENT_NAMES = {
  'Mubadala DC Open': '华盛顿公开赛', 'DC Open': '华盛顿公开赛',
  'Washington': '华盛顿', 'Memphis Classic': '孟菲斯精英赛',
  'Memphis': '孟菲斯', 'Australian Open': '澳大利亚网球公开赛',
  'Roland Garros': '法国网球公开赛', 'French Open': '法国网球公开赛',
  'Wimbledon': '温布尔登', 'US Open': '美国网球公开赛',
  'Indian Wells': '印第安维尔斯', 'Miami Open': '迈阿密公开赛',
  'Madrid Open': '马德里公开赛', 'Rome': '罗马',
  'Cincinnati': '辛辛那提', 'Beijing': '北京', 'Wuhan': '武汉',
  'Dubai': '迪拜', 'Doha': '多哈',
};

function translateTitle(title) {
  let t = title;
  t = t.replace(/\s*-\s*WTA Tennis$/i, '').replace(/\s*-\s*[A-Za-z\s]+$/, '');
  
  // 先翻译长词组
  const playerKeys = Object.keys(PLAYER_NAMES).sort((a, b) => b.length - a.length);
  for (const en of playerKeys) {
    t = t.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), PLAYER_NAMES[en]);
  }
  
  const tournamentKeys = Object.keys(TOURNAMENT_NAMES).sort((a, b) => b.length - a.length);
  for (const en of tournamentKeys) {
    t = t.replace(new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), TOURNAMENT_NAMES[en]);
  }
  
  return t;
}

async function main() {
  try {
    const xml = await getXML();
    const items = parseItems(xml);
    console.log(`Found ${items.length} items`);
    
    const filtered = filterNews(items);
    console.log(`After filtering: ${filtered.length} items`);
    
    const deduped = dedup(filtered);
    console.log(`After dedup: ${deduped.length} items`);
    
    const top3 = deduped.slice(0, 3);
    
    const news = top3.map(item => ({
      title: translateTitle(item.title),
      source: item.source,
      date: new Date(item.pubDate).toISOString().split('T')[0],
    }));
    
    const data = { news, updatedAt: new Date().toISOString() };
    
    const outPath = path.join(__dirname, '..', 'data', 'wta_news.json');
    fs.writeFileSync(outPath, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ 写入 ${news.length} 条新闻到 ${outPath}`);
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('❌ 获取新闻失败:', err.message);
    process.exit(1);
  }
}

main();

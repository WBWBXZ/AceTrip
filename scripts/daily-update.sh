#!/bin/bash
# AceTrip 每日数据更新脚本
# 用法: ./scripts/daily-update.sh
# 自动更新排名、积分、赛事冠军、参赛记录

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_DIR/data/update.log"

echo "$(date '+%Y-%m-%d %H:%M:%S') 🔄 开始每日数据更新..." | tee -a "$LOG_FILE"

cd "$PROJECT_DIR"

# 运行数据更新脚本
node scripts/fetch-data.js 2>&1 | tee -a "$LOG_FILE"

# 更新签表中文名映射
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/players_final.json', 'utf-8'));
const map = {};
for (const p of data.players || []) {
  const cn = p.nameCn || '';
  if (!cn) continue;
  if (p.displayName) map[p.displayName.toUpperCase()] = cn;
  if (p.firstName && p.lastName) {
    map[(p.lastName + ' ' + p.firstName).toUpperCase()] = cn;
    map[p.lastName.toUpperCase() + ' ' + p.firstName] = cn;
  }
}
fs.writeFileSync('data/player_name_cn.json', JSON.stringify(map, null, 2));
console.log('✅ 更新了 player_name_cn.json: ' + Object.keys(map).length + ' 条');
" 2>&1 | tee -a "$LOG_FILE"

# 更新 WTA 新闻
echo "$(date '+%Y-%m-%d %H:%M:%S') 正在更新 WTA 新闻..." | tee -a "$LOG_FILE"
RSS_TMP="/tmp/wta_rss_$$.xml"
if curl --fail --silent --show-error --location --max-time 30 "https://news.google.com/rss/search?q=WTA+tennis&hl=en&gl=US&ceid=US:en" -o "$RSS_TMP" 2>&1 | tee -a "$LOG_FILE"; then
  if [ -s "$RSS_TMP" ]; then
    node scripts/fetch-news.js "$RSS_TMP" 2>&1 | tee -a "$LOG_FILE"
    rm -f "$RSS_TMP"
  else
    echo "⚠️ Google News RSS 返回空内容，跳过新闻更新" | tee -a "$LOG_FILE"
  fi
else
  echo "⚠️ 无法获取 Google News RSS，跳过新闻更新" | tee -a "$LOG_FILE"
  rm -f "$RSS_TMP"
fi

echo "$(date '+%Y-%m-%d %H:%M:%S') ✅ 每日数据更新完成" | tee -a "$LOG_FILE"
echo "---" >> "$LOG_FILE"

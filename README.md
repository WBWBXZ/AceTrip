# 🎾 AceTrip — Game, Set, World

追踪 WTA 球员赛程，探索赛事城市，规划你的网球之旅

🌐 **在线 Demo**：[acetrip.vercel.app](https://acetrip.vercel.app)

---

## ✨ 功能一览

### 🏟️ 赛事中心
- 2026 赛季 **33 场 WTA 赛事**完整覆盖（四大满贯 + WTA1000 + WTA500 + WTA250）
- 实时签表数据（live-tennis.cn）
- 赛事城市天气预报（Open-Meteo）
- 当地汇率换算（13 种货币双向显示）
- 城市旅行指南（签证、交通、美食、住宿）

### 👩‍🎤 球员图鉴
- **150+ 位 WTA 球员**数据库
- 实时排名与积分明细
- 赛季战绩追踪
- 一键关注，打造你的专属球员列表

### 🗺️ 互动地图
- 全球赛事分布 Mapbox 3D 地图
- 关注球员赛程可视化
- 赛事心愿单

### 📰 Daily Feed
- 每日 WTA 新闻动态（Google News RSS）
- 中文翻译，自动更新

### 🔐 用户系统
- 手机号注册登录（Supabase Auth）
- 关注球员 & 赛事心愿单云端同步
- 意见信箱

---

## 🛠️ 技术栈

| 层 | 技术 |
|---|------|
| 框架 | Next.js 16 + React 19 + TypeScript |
| 样式 | Tailwind CSS 4 |
| 地图 | Mapbox GL JS |
| 数据库 | Supabase（PostgreSQL + Auth） |
| 部署 | Vercel |
| 数据源 | ESPN API · WTA API · live-tennis.cn · Open-Meteo · Google News RSS |

---

## 📦 快速开始

```bash
# 克隆仓库
git clone https://github.com/WBWBXZ/AceTrip.git
cd AceTrip

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入你的 API keys

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看。

---

## ⚙️ 环境变量

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL JS access token |

---

## 🔄 数据更新

数据通过两种方式保持最新：

**实时（用户访问时拉取）**
- 球员排名（live-tennis.cn）
- 赛事签表（live-tennis.cn）
- 天气预报（Open-Meteo）
- 汇率（Open Exchange Rates）

**每日自动更新（GitHub Actions，北京时间 8:00）**
- 球员信息、积分明细、赛季战绩
- Daily Feed 新闻
- 更新后自动部署到 Vercel

---

## 🗺️ Roadmap

### v1.0 ✅ 已完成
- [x] 首页（Hero + 动态地球 + 功能特色 + 球员排名 + 即将开赛 + 四大满贯 + 赛季总览 + Daily Feed）
- [x] 球员图鉴（150+ 球员 + 关注）
- [x] 赛事中心（签表 + 天气 + 汇率 + 旅行指南）
- [x] 互动地图（Mapbox）
- [x] 用户系统（手机号登录 + Supabase）
- [x] 意见信箱
- [x] 全站中文化
- [x] 移动端适配
- [x] Vercel 部署 + 每日数据自动更新

### v1.1 🚧 进行中
- [ ] 移动端 UI 深度优化
- [ ] 球员详情页重构
- [ ] 球员简介（Wikipedia API）
- [ ] 分享卡片/海报导出

### v1.2 📋 计划中
- [ ] 自定义域名
- [ ] SEO 优化（Open Graph + 结构化数据）
- [ ] 赛果实时推送
- [ ] 暗黑模式
- [ ] 多语言支持（英文版）
- [ ] PWA 离线支持

### v2.0 💡 远期展望
- [ ] 社区功能（球迷讨论区）
- [ ] 行程规划器（机票 + 酒店 + 门票一键规划）
- [ ] AI 旅行助手
- [ ] 小程序版本

---

## 📸 截图

### 首页
![首页 Hero](./docs/screenshots/home-hero.png)

### 功能特色
![功能特色](./docs/screenshots/home-features.png)

### 球员排名
![球员排名](./docs/screenshots/home-rankings.png)

### 即将开赛
![即将开赛](./docs/screenshots/home-upcoming.png)

### 四大满贯
![四大满贯](./docs/screenshots/home-grandslam.png)

---

## 📚 项目文档

- [产品需求文档](./docs/PRD.md)
- [项目交接文档](./docs/HANDOFF.md)

---

## 🙋 关于

AceTrip 由一个没有技术背景的文科生独立开发，灵感来自对 WTA 网球和 Elena Rybakina 的热爱。

如果你也是网球迷，欢迎 Star ⭐ 这个项目，或者通过网站里的意见信箱告诉我你的想法。

---

## 📄 License

MIT © 2026 AceTrip

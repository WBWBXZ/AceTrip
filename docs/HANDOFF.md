# AceTrip 项目交接文档

最后更新：2026-08-07

## 1. 项目概览

AceTrip 是面向 WTA 球迷的赛事旅行指南，提供球员排名与赛程、赛事签表、赛事城市信息、天气与汇率、关注球员、赛事心愿单和球迷内容创作等能力。

主要技术栈为 Next.js 16、React 19、TypeScript、Tailwind CSS 4、Supabase、Mapbox GL JS 和 Vercel。核心赛事及球员数据位于 `data/`，构建时由应用直接导入；用户关注、赛事心愿单和反馈数据存储在 Supabase。

## 2. 补充功能模块

### 2.1 `/bucket-list` 赛事心愿单

`/bucket-list` 是用户的网球旅行心愿单和观赛记录页面。用户可以从赛事详情页将赛事加入或移出心愿单，并在该页面集中查看计划中的赛事。

页面不仅展示赛事卡片，还包含网球旅行护照、赛事打卡、成就徽章、旅程规划、打卡日记、赛事评分和分享卡片等交互。完成赛事打卡后，可记录日记与评分，并生成护照或打卡分享内容。

登录用户的心愿单基础关系会同步到 Supabase 的 `user_wishlist` 表。当前 `completed`、日记和评分等扩展状态只保存在前端 Zustand 状态中，没有写入 Supabase；刷新页面或重新登录后，这些扩展状态不会从云端恢复。后续如需长期保存，应扩展 `user_wishlist` 表并补充同步逻辑。

主要代码：

- 页面入口：`src/app/bucket-list/page.tsx`
- 页面交互：`src/components/tournaments/BucketListClient.tsx`
- 状态管理：`src/lib/store.ts`
- 分享卡片：`src/components/share/ShareCard.tsx`

### 2.2 `/zine` 球迷手账

`/zine` 是面向球迷的可视化内容创作页面。用户可以创建球员应援卡、赛事打卡日记、赛季最佳时刻等作品，也可以从空白画布开始编辑。

编辑器支持文字、图片、表情、颜色、图层、对齐、模板初始化、保存和图片导出。作品可以再次打开编辑或从作品列表删除。

当前 Zine 作品仅保存在 Zustand 内存状态中，未写入 Supabase，也未启用浏览器持久化；页面刷新后作品可能丢失。若该功能进入正式使用阶段，建议新增 `user_zines` 表，保存作品元数据和画布 JSON，并将用户上传图片存入 Supabase Storage。

主要代码：

- 页面入口：`src/app/zine/page.tsx`
- 编辑器：`src/components/zine/ZineEditor.tsx`
- 状态管理：`src/lib/store.ts`

## 3. Supabase 数据结构与 RLS

### 3.1 用户认证

项目使用 Supabase Auth。前端将手机号转换为 `<手机号>@acetrip.app` 形式的内部邮箱账号，再调用 Supabase 邮箱密码注册和登录接口。生产环境已关闭邮箱确认，因此注册后可直接登录。

### 3.2 业务表

| 表名 | 主要字段 | 用途 |
|---|---|---|
| `user_follows` | `user_id`、`player_id`、`created_at` | 保存用户关注的球员 |
| `user_wishlist` | `user_id`、`tournament_id`、`created_at` | 保存用户加入心愿单的赛事 |
| `feedback` | `user_id`、`phone`、`message`、`created_at` | 保存登录用户提交的意见反馈 |

建议为 `user_follows(user_id, player_id)` 和 `user_wishlist(user_id, tournament_id)` 建立唯一约束，避免重复关注或重复加入心愿单。`user_id` 应关联 `auth.users.id`，并为常用的 `user_id` 查询建立索引。

### 3.3 RLS 行级安全策略

三个业务表都必须启用 Row Level Security。原则是用户只能访问和修改自己的记录，判断条件统一使用：

```sql
auth.uid() = user_id
```

`user_follows` 和 `user_wishlist` 需要为 `SELECT`、`INSERT`、`DELETE` 分别配置策略；如未来增加可编辑字段，还需要配置 `UPDATE`。插入策略应使用 `WITH CHECK (auth.uid() = user_id)`，查询、更新和删除策略使用 `USING (auth.uid() = user_id)`。

`feedback` 至少需要允许登录用户插入自己的反馈。若前端不需要展示历史反馈，可以不开放普通用户的 `SELECT`；反馈读取应仅授予管理员或服务端角色。

前端使用 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`。Anon Key 可以公开在浏览器中，真正的数据隔离依赖 RLS，因此不得关闭生产表的 RLS，也不得把 Supabase Service Role Key 放入前端环境变量。

## 4. 每日数据更新与定时任务边界

### 4.1 GitHub Actions：每日静态数据更新主链路

`.github/workflows/daily-update.yml` 是静态数据更新的唯一主链路。计划任务使用 `0 0 * * *`，即每天 UTC 00:00、北京时间 08:00 运行，也支持手动触发。

执行流程为：拉取仓库代码，运行 `scripts/daily-update.sh`，抓取排名、赛事冠军、球员赛程、积分明细和新闻，更新 `data/*.json`，检测核心数据变化，有变化时提交并推送到 `main`。Vercel Git 集成检测到 push 后自动创建生产部署。

Workflow 会轮询该 commit 的 Vercel Commit Status，并在部署成功后请求线上 `/api/news` 验证数据时间戳。失败或降级信息会写入 GitHub Actions Summary，并以诊断 Artifact 保存。只有 `data/update.log` 变化时不会提交，也不会触发部署。

### 4.2 Vercel Cron：轻量健康检查

`vercel.json` 同样按 `0 0 * * *` 调用 `/api/cron`，但该接口不抓取、不修改、不提交静态数据，也不触发重新部署。它只验证 `CRON_SECRET` 后返回当前时间和健康状态，用于确认 Vercel 运行时及定时调用链路可用。

职责边界如下：

| 机制 | 负责 | 不负责 |
|---|---|---|
| GitHub Actions | 抓取外部数据、更新 JSON、commit、push、监控 Vercel 部署、验证线上数据 | 用户数据同步、Vercel 运行时健康检查 |
| Vercel Cron | `/api/cron` 健康检查和运行时触发验证 | 修改仓库文件、每日静态数据更新、重新部署 |
| Vercel Git 集成 | `main` 分支 push 后自动构建和生产部署 | 抓取业务数据、生成数据 commit |

不要在 Vercel Serverless 函数中直接修改 `data/*.json`。函数运行环境不是持久化仓库，运行时写入不会形成 Git commit，也不会可靠保留到下一次请求。

## 5. 运维检查

每日异常时，依次检查 GitHub Actions 的 `Daily Data Update`、本次运行的 Summary 和诊断 Artifact、是否产生 `chore: daily data update` commit、对应 commit 的 Vercel 状态，以及线上 `/api/news` 返回的 `updatedAt`。

外部数据源短暂失败时，脚本会保留该来源的旧数据并记录降级信息；程序错误、Vercel 部署失败或线上数据验证失败会使 workflow 显示失败。依赖安装固定使用公共 npm registry，相关配置位于 `.npmrc`、`package-lock.json` 和 `vercel.json`。

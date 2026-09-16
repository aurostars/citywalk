# 城迹 Citywalk

面向大学生的北京周末城市探索指南。选择活动类型和预算，在同页查看推荐路线，然后组队出发、记录打卡、分享攻略。

这是使用合成示例数据的前端原型。活动时间、费用、天气、路线、队伍和攻略均用于体验交互，不是实时出行信息；生成式图片仅作场景示意。

## 本地运行

推荐使用 Node.js 24，最低版本为 Node.js 22.12。

```bash
npm ci
npm run dev
```

开发地址：`http://localhost:5173/citywalk/`。

```bash
npm run test:run
npm run build
npx playwright install chromium
npm run test:e2e
```

生产构建输出到 `dist/`，可用 `npm run preview` 检查。E2E 使用生产预览服务，因此运行 `npm run test:e2e` 前应先构建；Chromium 已安装时无需重复执行安装命令。

## 使用

- 首次选择至少一种活动类型和一个预算范围，点击“生成周末计划”。
- 再次访问直接恢复结果；“调整偏好”用于修改兴趣和预算。
- 同行人数会影响推荐顺序，天气说明会标明实际匹配情况。
- 活动详情关联组队和打卡入口；创建记录后保留成功状态，便于确认。
- 组队、收藏、打卡、攻略和主题偏好只保存在当前浏览器的 `localStorage`。

没有账号、服务端同步、实时天气、地图、票务或支付。其他设备和用户看不到本机变更，清除站点数据会移除个人记录；打卡照片不会被请求或持久化。

图片始终使用项目指定的外部文生图端点，需要网络连接。服务尚未完成生成时可能返回带有 “The image is generating” 字样的临时栅格；请求失败时界面会保留稳定比例并显示本地回退，不会改用其他图片来源。

## 工程结构

| 路径 | 用途 |
| --- | --- |
| `src/app/` | 路由、共享状态、存储校验 |
| `src/data/` | 北京活动、路线、天气、队伍和攻略示例 |
| `src/features/` | 推荐、详情、组队、打卡、攻略 |
| `src/components/` | 导航、主题、图片及其他公共组件 |
| `e2e/` | Playwright 浏览器验收 |
| `docs/superpowers/` | 已确认的规格与实施计划 |

推荐算法位于 `src/features/recommendations/recommend.ts`。它先按预算过滤，再按活动类型、天气和同行人数匹配排序，同分时使用稳定的编辑顺序。个别维度不匹配时，页面应准确展示局限。

## GitHub Pages

仓库使用 GitHub Actions 构建静态站点，Vite 基础路径为 `/citywalk/`。页面使用哈希路由，因此刷新活动详情等子页面不会请求不存在的服务器路径。工作流在拉取请求和主分支上依次执行单元测试、构建和 Chromium E2E；只有主分支全部通过后才上传并部署 Pages 产物，失败诊断会作为短期 artifact 保留。

首次发布前，仓库管理员需要完成一次设置：选择 **Settings > Pages > Build and deployment > Source: GitHub Actions**。之后部署继续使用工作流内置的最小权限 `GITHUB_TOKEN`，无需添加管理权限密钥。

目标网址：<https://aurostars.github.io/citywalk/>。

技术栈：React、TypeScript、Vite、Tailwind CSS v4、Motion、Phosphor Icons、Vitest、Testing Library、Playwright。

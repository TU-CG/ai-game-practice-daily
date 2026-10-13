# AI 游戏应用实战日报

每天一个 AI 游戏应用主题，结合 Cocos Creator 与 Web/H5，提供实际场景、可复用的方法和能够验证的小实验。

- 网站：https://tu-cg.github.io/ai-game-practice-daily/
- 首期：https://tu-cg.github.io/ai-game-practice-daily/?date=2026-10-13#article
- 计划执行时间：每天北京时间 09:00，由作者的本地 Codex 定时任务生成并发布。
- 页面布局参考作者的 cocos-rendering-daily 项目。

## 内容范围

策划与原型、编程与工具、美术与音频、关卡与叙事、NPC 与 AI 玩法、自动试玩与数值验证、性能与渲染、运营与玩家体验，以及世界模型等前沿研究。

每期区分公开案例、原创示例和研究演示；注明适用环境、验证方式和来源。历史内容保留原始日期，技术方案请结合项目版本核实。

## 网站与数据

纯 HTML/CSS/JavaScript 静态网站，由 GitHub Pages 从 main 分支根目录提供服务。无构建依赖、无账号系统、无追踪脚本。阅读记录仅保存在浏览器 localStorage 中。

- `data/YYYY-MM-DD.json`：当天的完整文章。
- `data/reports.json`：分类词表和文章目录，新日期置顶，同日只保留一项。
- `assets/`：页面样式与渲染逻辑；日常内容任务仅更新 data。

文章结构：

```json
{
  "date": "2026-10-13",
  "tags": ["performance", "development"],
  "title": "文章标题",
  "summary": "文章摘要",
  "readingMinutes": 6,
  "stage": "实用方法",
  "scope": "Cocos Creator 3.8.x / Web",
  "sections": [{"heading": "章节标题", "body": "正文 Markdown"}],
  "sources": [{"title": "来源标题", "url": "https://example.com/"}]
}
```

正文支持段落、粗体、行内代码、代码围栏、简单列表、表格和 HTTPS 链接，不接受原始 HTML。每期建议 1–3 个现有标签、2–4 个已核验来源。分类 id 和文章字段以 data/reports.json 与首期文章为准。

发布授权只在作者本机内存中使用；凭据、自动化配置和私有运行日志不在本仓库中。

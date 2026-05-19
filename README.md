# 随手刷题

红色主题刷题项目，覆盖党的基础知识、建党精神、“四史”学习和中大红色校史。项目同时提供微信原生小程序和 H5 测试版，适合用于碎片化学习、快速自测和错题复盘。

## 在线体验

- H5 测试版：[随手刷题 H5](https://mmircle.github.io/red-quiz-miniapp/)
- H5 源码目录：[`h5/`](h5/)
- GitHub Pages 发布工作流：[`deploy-h5-pages.yml`](.github/workflows/deploy-h5-pages.yml)

## 功能概览

- 十题快练：随机抽取 10 道单选题，每题提交后即时展示答案、解析和知识点。
- 五十题精练：随机抽取 40 道单选题和 10 道多选题，交卷后统一计分和分析。
- 单选/多选：多选题支持反复点选和取消，需全部选对才得分。
- 题号面板：支持快速跳题，区分当前题、已作答题和已标记题。
- 标记本题：适合在五十题模式中先标记不确定题，交卷前集中检查。
- 结果分析：展示正确率、称号、错题回看、薄弱分类和复习建议。

## 项目结构

```text
.
├── app.js / app.json / app.wxss      # 微信小程序入口
├── pages/                            # 小程序页面
│   ├── index/                        # 首页
│   ├── quiz/                         # 答题页
│   └── result/                       # 结果页
├── data/questions/                   # 分模块题库
├── data/questionBank.js              # 小程序题库汇总入口
├── utils/quiz.js                     # 抽题、校验、判分、结果分析
├── h5/                               # 独立 H5 测试版
├── docs/QUESTION_BANK_GUIDE.md       # 题库维护指南
├── docs/UI_MODIFICATION_GUIDE.md     # UI 修改指南
└── .github/workflows/                # GitHub Actions
```

## 本地运行

### 微信小程序

1. 打开微信开发者工具。
2. 导入当前项目根目录。
3. AppID 可先使用测试号，或保留 `project.config.json` 中的配置。
4. 编译后从首页进入“十题快练”或“五十题精练”。

### H5 测试版

直接打开 [`h5/index.html`](h5/index.html) 即可本地预览。H5 使用 hash 路由，常用地址如下：

- `#/`
- `#/quiz?mode=quick`
- `#/quiz?mode=exam`
- `#/result?mode=quick`
- `#/result?mode=exam`

H5 为纯静态应用，不依赖后端；进行中的答题状态写入浏览器 `localStorage`，刷新页面后可恢复当前进度。

## 发布 H5 测试版

本仓库已配置 GitHub Actions，将 `h5/` 作为 GitHub Pages 站点根目录发布，工作流文件为 [`deploy-h5-pages.yml`](.github/workflows/deploy-h5-pages.yml)。

首次启用时，在 GitHub 仓库页面进入：

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

之后有两种发布方式：

- 推送 `main` 分支中 `h5/**` 的变更，自动触发发布。
- 在 GitHub `Actions` 页面手动运行 `Deploy H5 to GitHub Pages`。

部署完成后，GitHub Pages 会提供 HTTPS 地址。面向微信内置浏览器分享时，请务必使用 HTTPS 链接。

## 题库维护

题库按主题拆分在 `data/questions/`：

- `partyBasic.js`：党的基础知识
- `foundingSpirit.js`：建党精神
- `fourHistories.js`：“四史”学习
- `sysuRedHistory.js`：中大红色校史

小程序题库汇总入口为 [`data/questionBank.js`](data/questionBank.js)。新增或修改题目前，请先阅读 [`docs/QUESTION_BANK_GUIDE.md`](docs/QUESTION_BANK_GUIDE.md)。

题目结构保持 JSON 兼容：

```js
{
  "id": "party-basic-001",
  "type": "single",
  "category": "partyBasic",
  "difficulty": "easy",
  "stem": "中国共产党的根本宗旨是？",
  "options": [
    { "key": "A", "text": "全心全意为人民服务" },
    { "key": "B", "text": "实现个人利益最大化" }
  ],
  "answer": ["A"],
  "explanation": "全心全意为人民服务是中国共产党的根本宗旨。",
  "knowledgePoint": "党的宗旨",
  "tags": ["党的基础知识"]
}
```

字段要求：

- `id` 必须唯一。
- `type` 只能是 `single` 或 `multiple`。
- `category` 需要在 `categoryLabels` 中配置展示名称。
- `options[].key` 在同一题内必须唯一。
- `answer` 必须是数组，且每个答案 key 都必须存在于 `options`。
- 单选题 `answer` 只能有 1 项；多选题 `answer` 至少有 2 项。
- `explanation` 和 `knowledgePoint` 用于即时反馈、错题回看和薄弱点分析。

## H5 题库同步提醒

H5 当前使用独立的 [`h5/question-bank.js`](h5/question-bank.js) 静态题库文件。更新题库后，需要同步更新 H5 题库文件，并修改 [`h5/index.html`](h5/index.html) 中的题库版本号，例如：

```html
<script defer src="./question-bank.js?v=20260519"></script>
```

这样可以避免用户浏览器长期命中旧缓存。

## 开发说明

- 通用答题规则优先维护在 [`utils/quiz.js`](utils/quiz.js)。
- 小程序 UI 修改前，请阅读 [`docs/UI_MODIFICATION_GUIDE.md`](docs/UI_MODIFICATION_GUIDE.md)。
- H5 说明和部署注意事项见 [`h5/README.md`](h5/README.md)。
- 当前 H5 不接后端、不做登录、不做运营统计，适合快速发布测试版。

## 后续方向

- 增加错题本、收藏题和专项练习。
- 将本地题库迁移到云开发数据库或后台 API。
- 为红色校史题库增加来源字段，如 `sourceTitle`、`sourceUrl`、`verifiedBy`。
- 增加每日一练和连续学习天数。
- 增加管理员题库导入校验页，降低后续维护成本。

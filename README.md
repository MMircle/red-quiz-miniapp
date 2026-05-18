# 红色主题随手刷题微信小程序

这是一个微信原生小程序工程，用于党的基础知识、建党精神、“四史”学习和中大红色校史的随手刷题。

## 功能

- 十题快练：抽取 10 道单选题，每题提交后即时展示答案、解析和知识点，完成后展示总成绩、称号、错题和薄弱点建议。
- 五十题精练：抽取 40 道单选题和 10 道多选题，答题过程中不显示对错，最后一题统一交卷后展示成绩分析。
- 答题交互：第一题禁用“上一题”；返回上一题保留已选答案；十题快练提交后锁定答案；五十题精练交卷前均可修改答案。
- 多选交互：选项可多次点选或取消；十题快练点击“提交本题”后锁定，五十题精练最终交卷后统一计分。
- 五十题精练不设置“提交本题”，只通过上一题/下一题切换，最后一题显示“提交试卷”。
- 答题页支持快速选题号和标记本题，便于五十题模式检查未答题、标记题。
- 查缺补漏：结果页按分类和知识点统计错题，并给出复习建议。

## 运行

1. 用微信开发者工具导入当前目录。
2. AppID 可先使用测试号或继续保留 `project.config.json` 中的 `touristappid`。
3. 编译后从首页进入十题快练或五十题精练。

## H5 测试版发布

项目已新增独立 H5 测试版，源码位于 `h5/` 目录，可作为静态站点发布。GitHub Pages 发布使用 GitHub Actions，工作流见 `.github/workflows/deploy-h5-pages.yml`。

首次启用时，在 GitHub 仓库页面进入 `Settings` -> `Pages`，将 `Build and deployment` 的 `Source` 设为 `GitHub Actions`。之后推送 `main` 分支，或在 Actions 页面手动运行 `Deploy H5 to GitHub Pages`，即可把 `h5/` 发布为 Pages 站点。

更多说明见 `h5/README.md`。

## 题库位置

题库按模块拆分在 `data/questions/` 目录：

- `data/questions/partyBasic.js`：党的基础知识。
- `data/questions/foundingSpirit.js`：建党精神。
- `data/questions/fourHistories.js`：“四史”学习。
- `data/questions/sysuRedHistory.js`：中大红色校史。

汇总入口：`data/questionBank.js`

后续新增和修改题目请先阅读 `docs/QUESTION_BANK_GUIDE.md`。

题库导出结构保持 JSON 兼容：

```js
module.exports = {
  categoryLabels,
  questions
}
```

## 单选题输入格式

```json
{
  "id": "party-basic-001",
  "type": "single",
  "category": "partyBasic",
  "difficulty": "easy",
  "stem": "中国共产党的根本宗旨是？",
  "options": [
    { "key": "A", "text": "全心全意为人民服务" },
    { "key": "B", "text": "实现个人利益最大化" },
    { "key": "C", "text": "发展单一经济形式" },
    { "key": "D", "text": "只重视经济建设" }
  ],
  "answer": ["A"],
  "explanation": "全心全意为人民服务是中国共产党的根本宗旨。",
  "knowledgePoint": "党的宗旨",
  "tags": ["党的基础知识"]
}
```

## 多选题输入格式

```json
{
  "id": "four-history-001",
  "type": "multiple",
  "category": "fourHistories",
  "difficulty": "normal",
  "stem": "“四史”学习通常包括哪些内容？",
  "options": [
    { "key": "A", "text": "党史" },
    { "key": "B", "text": "新中国史" },
    { "key": "C", "text": "改革开放史" },
    { "key": "D", "text": "社会主义发展史" }
  ],
  "answer": ["A", "B", "C", "D"],
  "explanation": "“四史”一般指党史、新中国史、改革开放史、社会主义发展史。",
  "knowledgePoint": "四史构成",
  "tags": ["四史学习"]
}
```

## 字段规则

- `id` 必须唯一。
- `type` 只能是 `single` 或 `multiple`。
- `category` 需要在 `categoryLabels` 中配置展示名称。
- `options[].key` 在同一题内必须唯一。
- `answer` 必须是数组，且每个 key 都必须存在于 `options`。
- 单选题 `answer` 只能有 1 项。
- 多选题 `answer` 至少有 2 项。
- `explanation` 和 `knowledgePoint` 用于即时反馈、错题回看和薄弱点分析。

## 答题页交互差异

- 十题快练：每题选择后点击“提交本题”，立即显示正确答案、解析和知识点；提交后不能修改该题。
- 五十题精练：选择后不需要逐题提交，答案可在交卷前反复修改；最后一题点击“提交试卷”统一计分。
- 快速选题号：答题页顶部“题号”按钮可展开题号面板，金底表示已作答，红框表示当前题，角标表示已标记。
- 标记功能：点击“标记本题”可标记当前题，再点一次取消标记。

## 后续改进建议

- 增加错题本、收藏题和专项练习。
- 将本地题库迁移到云开发数据库或后台 API。
- 为红色校史题库增加来源字段，如 `sourceTitle`、`sourceUrl`、`verifiedBy`。
- 增加每日一练和连续学习天数。
- 增加管理员题库导入校验页，降低后续维护成本。

## 开发者 UI 指南

后续修改界面时，先阅读 `docs/UI_MODIFICATION_GUIDE.md`，其中包含页面结构、红色主题规范、答题页状态规则和修改后检查清单。

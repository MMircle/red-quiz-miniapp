# 红色主题随手刷题微信小程序

这是一个微信原生小程序工程，用于党的基础知识、建党精神、“四史”学习和中大红色校史的随手刷题。

## 功能

- 十题快练：抽取 10 道单选题，每题提交后即时展示答案、解析和知识点，完成后展示总成绩、称号、错题和薄弱点建议。
- 五十题精练：抽取 40 道单选题和 10 道多选题，答题过程中不显示对错，交卷后统一展示成绩分析。
- 答题交互：第一题禁用“上一题”；返回上一题保留已选答案；已提交题目锁定答案，不能重复改分。
- 多选交互：选项可多次点选或取消，必须点击“提交本题”后锁定。
- 查缺补漏：结果页按分类和知识点统计错题，并给出复习建议。

## 运行

1. 用微信开发者工具导入当前目录。
2. AppID 可先使用测试号或继续保留 `project.config.json` 中的 `touristappid`。
3. 编译后从首页进入十题快练或五十题精练。

## 题库位置

题库文件：`data/questionBank.js`

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

## 后续改进建议

- 增加错题本、收藏题和专项练习。
- 将本地题库迁移到云开发数据库或后台 API。
- 为红色校史题库增加来源字段，如 `sourceTitle`、`sourceUrl`、`verifiedBy`。
- 增加每日一练和连续学习天数。
- 增加管理员题库导入校验页，降低后续维护成本。

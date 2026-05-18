# 题库增加与修改指南

本文档面向后续题库维护者，说明如何新增、修改、核验题目，避免题库扩充后影响十题快练和五十题精练。

## 1. 文件结构

题库按 4 个学习模块拆分：

- `data/questions/partyBasic.js`：党的基础知识。
- `data/questions/foundingSpirit.js`：建党精神。
- `data/questions/fourHistories.js`：“四史”学习。
- `data/questions/sysuRedHistory.js`：中大红色校史。

统一入口：

- `data/questionBank.js`：汇总四个模块并导出 `categoryLabels` 和 `questions`。

一般情况下，新增或修改题目只改 `data/questions/*.js`。不要直接在页面文件中写题目。

## 2. 分类字段

题目的 `category` 必须与所在文件一致：

| 文件 | category | 页面显示 |
| --- | --- | --- |
| `partyBasic.js` | `partyBasic` | 党的基础知识 |
| `foundingSpirit.js` | `foundingSpirit` | 建党精神 |
| `fourHistories.js` | `fourHistories` | “四史”学习 |
| `sysuRedHistory.js` | `sysuRedHistory` | 中大红色校史 |

如果未来新增第 5 个模块，需要同时更新：

- 新增 `data/questions/<category>.js`
- 修改 `data/questionBank.js` 的 `require` 和 `concat`
- 增加 `categoryLabels` 显示名称
- 按需调整首页、结果页或专项练习入口

## 3. 单选题格式

```js
{
  id: "party-basic-001",
  type: "single",
  category: "partyBasic",
  difficulty: "easy",
  stem: "中国共产党的根本宗旨是？",
  options: [
    { key: "A", text: "全心全意为人民服务" },
    { key: "B", text: "实现个人利益最大化" },
    { key: "C", text: "发展单一经济形式" },
    { key: "D", text: "只重视经济建设" }
  ],
  answer: ["A"],
  explanation: "全心全意为人民服务是中国共产党的根本宗旨。",
  knowledgePoint: "党的宗旨",
  tags: ["党的基础知识"]
}
```

单选题要求：

- `type` 固定为 `single`。
- `answer` 必须是数组，但只能放 1 个选项 key。
- `answer` 中的 key 必须存在于 `options`。

## 4. 多选题格式

```js
{
  id: "four-history-multi-001",
  type: "multiple",
  category: "fourHistories",
  difficulty: "normal",
  stem: "“四史”学习通常包括哪些内容？",
  options: [
    { key: "A", text: "党史" },
    { key: "B", text: "新中国史" },
    { key: "C", text: "改革开放史" },
    { key: "D", text: "社会主义发展史" }
  ],
  answer: ["A", "B", "C", "D"],
  explanation: "“四史”一般指党史、新中国史、改革开放史、社会主义发展史。",
  knowledgePoint: "四史构成",
  tags: ["四史学习", "多选题"]
}
```

多选题要求：

- `type` 固定为 `multiple`。
- `answer` 至少包含 2 个选项 key。
- 漏选、多选、错选均不得分。
- 答案顺序不影响评分，但建议按选项顺序填写，便于维护。

## 5. ID 命名建议

`id` 必须全题库唯一。建议使用以下格式：

- 党的基础知识：`party-basic-001`
- 建党精神：`founding-spirit-001`
- “四史”学习：`four-history-001`
- 中大红色校史：`sysu-red-001`
- 多选题可增加 `multi`：`party-basic-multi-001`

修改已有题目时尽量不要改 `id`，否则后续错题本、收藏题、学习记录等功能会难以追踪历史数据。

## 6. 题量要求

当前模式对题量有硬性要求：

- 十题快练：至少 10 道单选题。
- 五十题精练：至少 40 道单选题 + 10 道多选题。

如果题库总量不足，首页会显示题库校验错误，答题页不会正常开始。

## 7. 修改流程

新增题目：

1. 根据主题选择对应 `data/questions/*.js` 文件。
2. 在数组末尾追加题目对象。
3. 确认 `category` 与文件主题一致。
4. 确认 `id` 不重复。
5. 运行题库校验。

修改题目：

1. 优先修改 `stem`、`options`、`answer`、`explanation`、`knowledgePoint`。
2. 如果改了选项 key，必须同步检查 `answer`。
3. 如果改了分类，应该把题目移动到对应模块文件，而不是只改 `category`。
4. 正式题库中涉及具体史实的题目，必须复核来源。

## 8. 校验命令

在项目根目录运行：

```bash
node -e "const q=require('./utils/quiz'); console.log(q.validateQuestionBank())"
```

如果本机 `node` 不可用，可用 Codex 工作区运行时：

```bash
C:\Users\Admin\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe -e "const q=require('./utils/quiz'); console.log(q.validateQuestionBank())"
```

校验通过时应看到：

```js
{
  ok: true,
  errors: [],
  counts: { all: 50, single: 40, multiple: 10 }
}
```

题库扩充后 `all`、`single`、`multiple` 可以变大，但 `ok` 必须为 `true`。

## 9. 内容质量建议

- 题干应只问一个明确问题，避免一句题干同时考多个点。
- 选项长度尽量接近，避免正确答案过于明显。
- 解析要说明为什么正确，而不是简单重复答案。
- `knowledgePoint` 应具体，例如“党的宗旨”“四史构成”“中大校训”，不要只写“大题库”。
- 红色校史题正式上线前，应增加来源字段或在维护记录中标注来源。
- 涉及时间、人物、会议、校史事实的题目，应由人工对照权威资料复核。

## 10. 常见错误

- `answer` 写成字符串而不是数组。
- 单选题 `answer` 放了多个选项。
- 多选题 `answer` 只有一个选项。
- `answer` 中出现了不存在的选项 key。
- 题目 `id` 重复。
- 题目放在一个文件里，但 `category` 写成另一个模块。
- 修改选项后忘记同步修改解析。

const { questions, categoryLabels } = require("../data/questionBank")

const MODE_CONFIG = {
  quick: {
    key: "quick",
    title: "十题快练",
    description: "每题提交后立即反馈，适合碎片时间边练边学。",
    total: 10,
    single: 10,
    multiple: 0,
    instantFeedback: true,
    resultTone: "light"
  },
  exam: {
    key: "exam",
    title: "五十题精练",
    description: "40道单选加10道多选，交卷后统一分析。",
    total: 50,
    single: 40,
    multiple: 10,
    instantFeedback: false,
    resultTone: "full"
  }
}

function getModeConfig(mode) {
  return MODE_CONFIG[mode] || MODE_CONFIG.quick
}

function shuffle(list) {
  const copy = list.slice()
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = copy[i]
    copy[i] = copy[j]
    copy[j] = temp
  }
  return copy
}

function sortKeys(keys) {
  return (keys || []).slice().sort()
}

function sameAnswer(left, right) {
  const a = sortKeys(left)
  const b = sortKeys(right)
  if (a.length !== b.length) return false
  return a.every((item, index) => item === b[index])
}

function scoreQuestion(question, selected) {
  return sameAnswer(question.answer, selected)
}

function formatAnswer(question, keys) {
  if (!keys || !keys.length) return "未作答"
  const selected = {}
  keys.forEach((key) => {
    selected[key] = true
  })
  const labels = question.options
    .filter((option) => selected[option.key])
    .map((option) => `${option.key}. ${option.text}`)
  return labels.length ? labels.join("；") : "未作答"
}

function validateQuestionBank() {
  const errors = []
  const seenIds = {}
  let singleCount = 0
  let multipleCount = 0

  questions.forEach((question, index) => {
    const label = question.id || `第${index + 1}题`
    if (!question.id) errors.push(`${label} 缺少 id`)
    if (seenIds[question.id]) errors.push(`${label} id 重复`)
    seenIds[question.id] = true

    if (question.type === "single") singleCount += 1
    if (question.type === "multiple") multipleCount += 1
    if (question.type !== "single" && question.type !== "multiple") {
      errors.push(`${label} type 必须是 single 或 multiple`)
    }

    if (!Array.isArray(question.options) || question.options.length < 2) {
      errors.push(`${label} 至少需要两个选项`)
    }

    const optionKeys = {}
    ;(question.options || []).forEach((option) => {
      if (!option.key || !option.text) errors.push(`${label} 选项缺少 key 或 text`)
      if (optionKeys[option.key]) errors.push(`${label} 选项 key 重复：${option.key}`)
      optionKeys[option.key] = true
    })

    if (!Array.isArray(question.answer) || !question.answer.length) {
      errors.push(`${label} answer 必须是非空数组`)
    } else {
      question.answer.forEach((key) => {
        if (!optionKeys[key]) errors.push(`${label} 答案 ${key} 不在选项中`)
      })
      if (question.type === "single" && question.answer.length !== 1) {
        errors.push(`${label} 单选题 answer 只能有 1 项`)
      }
      if (question.type === "multiple" && question.answer.length < 2) {
        errors.push(`${label} 多选题 answer 至少需要 2 项`)
      }
    }

    if (!question.explanation) errors.push(`${label} 缺少 explanation`)
    if (!question.knowledgePoint) errors.push(`${label} 缺少 knowledgePoint`)
    if (!categoryLabels[question.category]) errors.push(`${label} category 未配置显示名称`)
  })

  if (singleCount < MODE_CONFIG.exam.single) {
    errors.push(`五十题模式需要至少 ${MODE_CONFIG.exam.single} 道单选题，当前 ${singleCount} 道`)
  }
  if (multipleCount < MODE_CONFIG.exam.multiple) {
    errors.push(`五十题模式需要至少 ${MODE_CONFIG.exam.multiple} 道多选题，当前 ${multipleCount} 道`)
  }
  if (singleCount < MODE_CONFIG.quick.single) {
    errors.push(`十题模式需要至少 ${MODE_CONFIG.quick.single} 道单选题，当前 ${singleCount} 道`)
  }

  return {
    ok: errors.length === 0,
    errors,
    counts: {
      all: questions.length,
      single: singleCount,
      multiple: multipleCount
    }
  }
}

function buildQuiz(mode) {
  const config = getModeConfig(mode)
  const validation = validateQuestionBank()
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      questions: [],
      config
    }
  }

  const singles = shuffle(questions.filter((question) => question.type === "single")).slice(0, config.single)
  const multiples = shuffle(questions.filter((question) => question.type === "multiple")).slice(0, config.multiple)
  const selectedQuestions = shuffle(singles.concat(multiples))

  return {
    ok: true,
    errors: [],
    questions: selectedQuestions,
    config
  }
}

function getHonor(percent) {
  if (percent === 100) return "红心满分领航者"
  if (percent >= 90) return "信仰先锋"
  if (percent >= 75) return "笃学标兵"
  if (percent >= 60) return "奋进学员"
  return "星火再燃学习者"
}

function makeAdvice(mistakes, weakCategories, weakKnowledgePoints) {
  if (!mistakes.length) {
    return ["本次答题全部正确，可以继续挑战五十题精练或扩充更高难度题库。"]
  }

  const advice = []
  if (weakCategories.length) {
    advice.push(`优先复习${weakCategories.map((item) => item.label).join("、")}相关内容。`)
  }
  if (weakKnowledgePoints.length) {
    advice.push(`重点回看${weakKnowledgePoints.map((item) => item.label).join("、")}等知识点。`)
  }
  advice.push("建议先阅读错题解析，再回到题库补充同类题，形成专项练习。")
  return advice
}

function topStats(counter, totalCounter, limit) {
  return Object.keys(counter)
    .map((key) => ({
      key,
      label: totalCounter[key] && totalCounter[key].label ? totalCounter[key].label : key,
      wrong: counter[key],
      total: totalCounter[key] ? totalCounter[key].total : counter[key]
    }))
    .sort((a, b) => b.wrong - a.wrong || b.total - a.total)
    .slice(0, limit)
}

function calculateResult(mode, quizQuestions, answers) {
  const config = getModeConfig(mode)
  let correctCount = 0
  const mistakes = []
  const categoryWrong = {}
  const categoryTotal = {}
  const knowledgeWrong = {}
  const knowledgeTotal = {}

  quizQuestions.forEach((question, index) => {
    const answer = answers[index] || { selected: [] }
    const selected = answer.selected || []
    const correct = scoreQuestion(question, selected)
    const categoryLabel = categoryLabels[question.category] || question.category

    categoryTotal[question.category] = categoryTotal[question.category] || {
      label: categoryLabel,
      total: 0
    }
    categoryTotal[question.category].total += 1

    knowledgeTotal[question.knowledgePoint] = knowledgeTotal[question.knowledgePoint] || {
      label: question.knowledgePoint,
      total: 0
    }
    knowledgeTotal[question.knowledgePoint].total += 1

    if (correct) {
      correctCount += 1
      return
    }

    categoryWrong[question.category] = (categoryWrong[question.category] || 0) + 1
    knowledgeWrong[question.knowledgePoint] = (knowledgeWrong[question.knowledgePoint] || 0) + 1

    mistakes.push({
      index: index + 1,
      id: question.id,
      type: question.type,
      typeLabel: question.type === "multiple" ? "多选题" : "单选题",
      category: question.category,
      categoryLabel,
      stem: question.stem,
      selected,
      answer: question.answer,
      selectedText: formatAnswer(question, selected),
      answerText: formatAnswer(question, question.answer),
      explanation: question.explanation,
      knowledgePoint: question.knowledgePoint,
      tags: question.tags || []
    })
  })

  const total = quizQuestions.length
  const percent = total ? Math.round((correctCount / total) * 100) : 0
  const weakCategories = topStats(categoryWrong, categoryTotal, 3)
  const weakKnowledgePoints = topStats(knowledgeWrong, knowledgeTotal, 3)

  return {
    mode,
    title: config.title,
    resultTone: config.resultTone,
    total,
    correctCount,
    wrongCount: total - correctCount,
    percent,
    honor: getHonor(percent),
    mistakes,
    weakCategories,
    weakKnowledgePoints,
    advice: makeAdvice(mistakes, weakCategories, weakKnowledgePoints)
  }
}

module.exports = {
  MODE_CONFIG,
  categoryLabels,
  questions,
  getModeConfig,
  validateQuestionBank,
  buildQuiz,
  scoreQuestion,
  formatAnswer,
  calculateResult
}

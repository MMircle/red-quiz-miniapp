const {
  buildQuiz,
  getModeConfig,
  categoryLabels,
  scoreQuestion,
  formatAnswer,
  calculateResult
} = require("../../utils/quiz")

Page({
  data: {
    mode: "quick",
    modeConfig: getModeConfig("quick"),
    questions: [],
    answers: [],
    marks: [],
    navItems: [],
    currentIndex: 0,
    currentQuestion: {},
    currentAnswer: {
      selected: [],
      submitted: false,
      correct: false
    },
    viewOptions: [],
    feedback: {},
    showQuestionPanel: false,
    canSubmit: false,
    isFirst: true,
    isLast: false,
    isCurrentMarked: false,
    answeredCount: 0,
    markedCount: 0,
    progressPercent: 0,
    loadError: false,
    loadErrors: []
  },

  onLoad(query) {
    const mode = query.mode || "quick"
    const quiz = buildQuiz(mode)

    if (!quiz.ok) {
      this.setData({
        mode,
        modeConfig: quiz.config,
        loadError: true,
        loadErrors: quiz.errors
      })
      return
    }

    const answers = quiz.questions.map(() => ({
      selected: [],
      submitted: false,
      correct: false
    }))
    const marks = quiz.questions.map(() => false)

    getApp().globalData.lastQuiz = {
      mode,
      questions: quiz.questions
    }

    this.setData(
      {
        mode,
        modeConfig: quiz.config,
        questions: quiz.questions,
        answers,
        marks,
        currentIndex: 0,
        loadError: false,
        loadErrors: []
      },
      () => this.syncCurrentQuestion()
    )
  },

  syncCurrentQuestion() {
    const { questions, answers, marks, currentIndex, modeConfig } = this.data
    const question = questions[currentIndex]
    const answer = answers[currentIndex]
    if (!question || !answer) return

    const selectedMap = {}
    answer.selected.forEach((key) => {
      selectedMap[key] = true
    })
    const answerMap = {}
    question.answer.forEach((key) => {
      answerMap[key] = true
    })

    const showFeedback = modeConfig.instantFeedback && answer.submitted
    const viewOptions = question.options.map((option) => ({
      ...option,
      selected: !!selectedMap[option.key],
      correct: showFeedback && !!answerMap[option.key],
      wrong: showFeedback && !!selectedMap[option.key] && !answerMap[option.key]
    }))

    const navItems = questions.map((item, index) => ({
      number: index + 1,
      current: index === currentIndex,
      answered: answers[index].selected.length > 0,
      submitted: answers[index].submitted,
      marked: marks[index],
      type: item.type
    }))
    const answeredCount = answers.filter((item) => item.selected.length > 0).length
    const markedCount = marks.filter(Boolean).length

    this.setData({
      currentQuestion: {
        ...question,
        typeLabel: question.type === "multiple" ? "多选题" : "单选题",
        categoryLabel: categoryLabels[question.category] || question.category
      },
      currentAnswer: answer,
      viewOptions,
      navItems,
      feedback: {
        selectedText: formatAnswer(question, answer.selected),
        answerText: formatAnswer(question, question.answer)
      },
      canSubmit: !answer.submitted && answer.selected.length > 0,
      isFirst: currentIndex === 0,
      isLast: currentIndex === questions.length - 1,
      isCurrentMarked: !!marks[currentIndex],
      answeredCount,
      markedCount,
      progressPercent: questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0
    })
  },

  onOptionTap(event) {
    const key = event.currentTarget.dataset.key
    const { answers, currentIndex, questions, modeConfig } = this.data
    const question = questions[currentIndex]
    const answer = answers[currentIndex]

    if (!question) return
    if (modeConfig.instantFeedback && answer.submitted) return

    if (question.type === "single") {
      answer.selected = [key]
    } else {
      const exists = answer.selected.indexOf(key) >= 0
      answer.selected = exists
        ? answer.selected.filter((item) => item !== key)
        : answer.selected.concat(key)
    }

    answers[currentIndex] = answer
    this.setData({ answers }, () => this.syncCurrentQuestion())
  },

  submitQuestion() {
    const { answers, currentIndex, questions } = this.data
    const question = questions[currentIndex]
    const answer = answers[currentIndex]

    if (!answer.selected.length) {
      wx.showToast({
        title: "请选择答案",
        icon: "none"
      })
      return
    }

    answer.submitted = true
    answer.correct = scoreQuestion(question, answer.selected)
    answers[currentIndex] = answer
    this.setData({ answers }, () => this.syncCurrentQuestion())
  },

  prevQuestion() {
    if (this.data.currentIndex === 0) return
    this.setData(
      {
        currentIndex: this.data.currentIndex - 1,
        showQuestionPanel: false
      },
      () => this.syncCurrentQuestion()
    )
  },

  nextQuestion() {
    if (this.data.currentIndex >= this.data.questions.length - 1) return
    this.setData(
      {
        currentIndex: this.data.currentIndex + 1,
        showQuestionPanel: false
      },
      () => this.syncCurrentQuestion()
    )
  },

  toggleQuestionPanel() {
    this.setData({
      showQuestionPanel: !this.data.showQuestionPanel
    })
  },

  jumpToQuestion(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (Number.isNaN(index) || index < 0 || index >= this.data.questions.length) return

    this.setData(
      {
        currentIndex: index,
        showQuestionPanel: false
      },
      () => this.syncCurrentQuestion()
    )
  },

  toggleMark() {
    const { marks, currentIndex } = this.data
    marks[currentIndex] = !marks[currentIndex]
    this.setData({ marks }, () => this.syncCurrentQuestion())
  },

  finishQuiz() {
    const { modeConfig, answers } = this.data

    if (modeConfig.instantFeedback) {
      const unsubmittedIndex = answers.findIndex((answer) => !answer.submitted)
      if (unsubmittedIndex >= 0) {
        wx.showToast({
          title: `第${unsubmittedIndex + 1}题未提交`,
          icon: "none"
        })
        this.setData(
          {
            currentIndex: unsubmittedIndex
          },
          () => this.syncCurrentQuestion()
        )
        return
      }

      this.finalizeQuiz()
      return
    }

    const unansweredCount = answers.filter((answer) => !answer.selected.length).length
    wx.showModal({
      title: "确认交卷",
      content: unansweredCount
        ? `还有${unansweredCount}题未作答，未作答将按错误处理。是否仍然交卷？`
        : "提交后将不能再修改答案，是否确认交卷？",
      confirmText: "仍然交卷",
      cancelText: "继续检查",
      success: (res) => {
        if (res.confirm) {
          this.finalizeQuiz()
        } else {
          this.setData({
            showQuestionPanel: true
          })
        }
      }
    })
  },

  finalizeQuiz() {
    const { mode, questions, answers } = this.data
    const result = calculateResult(mode, questions, answers)
    getApp().globalData.lastResult = result
    wx.redirectTo({
      url: `/pages/result/result?mode=${mode}`
    })
  },

  backHome() {
    wx.navigateBack()
  }
})

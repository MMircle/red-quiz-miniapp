(function () {
  const SESSION_KEY = "quiz_session"
  const RESULT_KEY = "quiz_result"
  const root = document.getElementById("app")
  const core = window.QuizCore

  const app = {
    activeMistakeIndex: null,
    allowLeaveOnce: false,
    routeHash: normalizeHash(window.location.hash),
    session: null,
    suppressHashChange: false
  }

  function setAppHeight() {
    document.documentElement.style.setProperty("--app-height", `${window.innerHeight}px`)
  }

  function normalizeHash(hash) {
    if (!hash || hash === "#") return "#/"
    return hash
  }

  function normalizeMode(mode) {
    return mode === "exam" ? "exam" : "quick"
  }

  function parseRoute(hash) {
    const normalized = normalizeHash(hash || window.location.hash)
    const raw = normalized.replace(/^#/, "") || "/"
    const parts = raw.split("?")
    const path = parts[0] || "/"
    const params = new URLSearchParams(parts[1] || "")
    return {
      hash: normalized,
      path,
      mode: normalizeMode(params.get("mode"))
    }
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[char]))
  }

  function readStorage(key) {
    try {
      const raw = window.localStorage.getItem(key)
      return raw ? JSON.parse(raw) : null
    } catch (error) {
      return null
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
      return true
    } catch (error) {
      window.alert("浏览器存储不可用，请清理空间或更换浏览器后重试。")
      return false
    }
  }

  function removeStorage(key) {
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      // Ignore storage failures on old WebViews.
    }
  }

  function loadSession() {
    const session = readStorage(SESSION_KEY)
    if (!session || session.version !== 1 || !Array.isArray(session.questions)) return null
    if (!Array.isArray(session.answers) || !Array.isArray(session.marks)) return null
    return session
  }

  function saveSession(session) {
    session.updatedAt = Date.now()
    app.session = session
    return writeStorage(SESSION_KEY, session)
  }

  function clearSession() {
    app.session = null
    removeStorage(SESSION_KEY)
  }

  function clearResult() {
    removeStorage(RESULT_KEY)
  }

  function navigate(hash, options) {
    const allowLeave = !!(options && options.allowLeave)
    if (window.location.hash === hash) {
      app.allowLeaveOnce = false
      app.routeHash = normalizeHash(hash)
      renderRoute()
      return
    }
    app.allowLeaveOnce = allowLeave
    window.location.hash = hash
  }

  function createSession(mode) {
    mode = normalizeMode(mode)
    const quiz = core.buildQuiz(mode)
    if (!quiz.ok) {
      return quiz
    }

    return {
      ok: true,
      session: {
        version: 1,
        mode,
        questions: quiz.questions,
        answers: quiz.questions.map(() => ({
          selected: [],
          submitted: false,
          correct: false
        })),
        marks: quiz.questions.map(() => false),
        currentIndex: 0,
        showQuestionPanel: false,
        completed: false,
        startedAt: Date.now(),
        updatedAt: Date.now()
      }
    }
  }

  function startQuiz(mode) {
    mode = normalizeMode(mode)
    const validation = core.validateQuestionBank()
    if (!validation.ok) {
      window.alert(`题库校验未通过：\n${validation.errors.slice(0, 5).join("\n")}`)
      return
    }

    const created = createSession(mode)
    if (!created.ok) {
      window.alert(`题库暂不可用：\n${created.errors.slice(0, 5).join("\n")}`)
      return
    }

    clearResult()
    if (!saveSession(created.session)) return
    navigate(`#/quiz?mode=${created.session.mode}`)
  }

  function shouldBlockNavigation(targetHash) {
    const currentRoute = parseRoute(app.routeHash)
    const targetRoute = parseRoute(targetHash)
    const session = loadSession()
    return currentRoute.path === "/quiz"
      && targetRoute.hash !== currentRoute.hash
      && session
      && !session.completed
      && !app.allowLeaveOnce
  }

  function onHashChange() {
    const targetHash = normalizeHash(window.location.hash)

    if (app.suppressHashChange) {
      app.suppressHashChange = false
      app.routeHash = targetHash
      renderRoute()
      return
    }

    if (shouldBlockNavigation(targetHash)) {
      const confirmed = window.confirm("确认放弃本次答题？")
      if (!confirmed) {
        app.suppressHashChange = true
        window.location.hash = app.routeHash
        return
      }
      clearSession()
    }

    app.allowLeaveOnce = false
    app.routeHash = targetHash
    app.activeMistakeIndex = null
    renderRoute()
  }

  function renderRoute() {
    if (!core) {
      renderFatal("核心脚本加载失败，请刷新后重试。")
      return
    }

    const route = parseRoute(app.routeHash)
    if (route.path === "/" || route.path === "") {
      renderHome()
      return
    }
    if (route.path === "/quiz") {
      renderQuizRoute(route.mode)
      return
    }
    if (route.path === "/result") {
      renderResultRoute(route.mode)
      return
    }
    renderNotFound()
  }

  function renderFatal(message) {
    root.innerHTML = `
      <section class="panel empty-panel">
        <h1 class="empty-title">${escapeHtml(message)}</h1>
      </section>
    `
  }

  function renderNotFound() {
    root.innerHTML = `
      <section class="panel empty-panel">
        <h1 class="empty-title">页面不存在</h1>
        <p class="muted">请返回首页重新开始。</p>
        <button type="button" class="primary-button" data-action="go-home">返回首页</button>
      </section>
    `
  }

  function renderHome() {
    const validation = core.validateQuestionBank()
    const errorItems = validation.errors
      .map((item) => `<li>${escapeHtml(item)}</li>`)
      .join("")
    root.innerHTML = `
      <section class="hero">
        <div class="hero-kicker">红色知识学习平台</div>
        <h1 class="hero-title">随手刷题</h1>
        <p class="hero-copy">党的基础知识、建党精神、“四史”学习与中大红色校史，利用碎片时间查缺补漏。</p>
      </section>

      <section class="mode-grid" aria-label="练习模式">
        <article class="mode-card quick">
          <h2 class="mode-name">十题快练</h2>
          <p class="mode-meta">10道单选 · 即时反馈 · 总成绩分析</p>
          <button type="button" class="primary-button" data-action="start-quiz" data-mode="quick" ${validation.ok ? "" : "disabled"}>开始快练</button>
        </article>

        <article class="mode-card exam">
          <h2 class="mode-name">五十题精练</h2>
          <p class="mode-meta">40道单选 + 10道多选 · 交卷后统一分析</p>
          <button type="button" class="primary-button" data-action="start-quiz" data-mode="exam" ${validation.ok ? "" : "disabled"}>开始精练</button>
        </article>
      </section>

      <section class="panel">
        <h2 class="section-title">题库状态</h2>
        <p class="status-line ${validation.ok ? "ok" : "warn"}">
          ${validation.ok ? "题库校验通过，可正常抽题。" : `题库存在 ${validation.errors.length} 个问题，请先修正。`}
        </p>
        <div class="count-row">
          <div class="count-item">
            <strong class="count-number">${validation.counts.all}</strong>
            <span class="count-label">总题数</span>
          </div>
          <div class="count-item">
            <strong class="count-number">${validation.counts.single}</strong>
            <span class="count-label">单选</span>
          </div>
          <div class="count-item">
            <strong class="count-number">${validation.counts.multiple}</strong>
            <span class="count-label">多选</span>
          </div>
        </div>
        ${validation.ok ? "" : `<ul class="error-list">${errorItems}</ul>`}
      </section>

      <section class="panel">
        <h2 class="section-title">答题说明</h2>
        <div class="format-block">
          <strong class="format-title">单选题</strong>
          <span class="format-text">每题只有一个正确答案，点击选项后按页面按钮继续。</span>
        </div>
        <div class="format-block">
          <strong class="format-title">多选题</strong>
          <span class="format-text">每题可能有多个正确答案，可反复点选或取消，需全部选对才得分。</span>
        </div>
        <div class="format-block">
          <strong class="format-title">标记技巧</strong>
          <span class="format-text">遇到不确定的题目可先点“标记本题”，最后通过题号面板集中回看。</span>
        </div>
        <div class="format-block">
          <strong class="format-title">选题技巧</strong>
          <span class="format-text">点击“题号”可快速跳到指定题目，金色题号表示已作答，带角标表示已标记。</span>
        </div>
        <p class="muted">十题快练会逐题展示解析；五十题精练可先标记题目，最后统一提交查看成绩分析。</p>
      </section>
    `
  }

  function renderQuizRoute(mode) {
    let session = loadSession()
    if (!session || session.completed || session.mode !== mode) {
      const created = createSession(mode)
      if (!created.ok) {
        renderQuizError(mode, created.errors || ["题库暂不可用"])
        return
      }
      session = created.session
      if (!saveSession(session)) return
    }

    app.session = session
    renderQuiz(session)
  }

  function renderQuizError(mode, errors) {
    const config = core.getModeConfig(mode)
    root.innerHTML = `
      <section class="error-panel">
        <p class="mode-tip">${escapeHtml(config.title)}</p>
        <h1 class="error-title">题库暂不可用</h1>
        ${errors.map((item) => `<p class="error-text">${escapeHtml(item)}</p>`).join("")}
        <button type="button" class="primary-button" data-action="go-home">返回首页</button>
      </section>
    `
  }

  function renderQuiz(session) {
    const { questions, answers, marks, currentIndex } = session
    const question = questions[currentIndex]
    const answer = answers[currentIndex]
    const config = core.getModeConfig(session.mode)
    if (!question || !answer) {
      renderQuizError(session.mode, ["当前题目不存在，请重新开始。"])
      return
    }

    const selectedMap = {}
    answer.selected.forEach((key) => {
      selectedMap[key] = true
    })
    const answerMap = {}
    question.answer.forEach((key) => {
      answerMap[key] = true
    })

    const showFeedback = config.instantFeedback && answer.submitted
    const answeredCount = answers.filter((item) => item.selected.length > 0).length
    const markedCount = marks.filter(Boolean).length
    const progressPercent = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0
    const isFirst = currentIndex === 0
    const isLast = currentIndex === questions.length - 1
    const isCurrentMarked = !!marks[currentIndex]
    const canSubmit = !answer.submitted && answer.selected.length > 0
    const currentQuestion = {
      ...question,
      typeLabel: question.type === "multiple" ? "多选题" : "单选题",
      categoryLabel: core.categoryLabels[question.category] || question.category
    }

    const navItems = questions.map((item, index) => {
      const itemAnswer = answers[index]
      const classes = [
        "number-item",
        index === currentIndex ? "current" : "",
        itemAnswer.selected.length ? "answered" : "",
        itemAnswer.submitted ? "submitted" : "",
        marks[index] ? "marked" : ""
      ].filter(Boolean).join(" ")
      return `
        <button type="button" class="${classes}" data-action="jump-question" data-index="${index}" aria-label="第${index + 1}题">
          <span>${index + 1}</span>
          ${marks[index] ? "<span class=\"mark-dot\" aria-hidden=\"true\"></span>" : ""}
        </button>
      `
    }).join("")

    const optionItems = question.options.map((option) => {
      const selected = !!selectedMap[option.key]
      const correct = showFeedback && !!answerMap[option.key]
      const wrong = showFeedback && selected && !answerMap[option.key]
      const classes = [
        "option-item",
        selected ? "selected" : "",
        correct ? "correct" : "",
        wrong ? "wrong" : "",
        answer.submitted ? "locked" : ""
      ].filter(Boolean).join(" ")
      return `
        <button type="button" class="${classes}" data-action="select-option" data-key="${escapeHtml(option.key)}" ${answer.submitted && config.instantFeedback ? "disabled" : ""}>
          <span class="option-key">${escapeHtml(option.key)}</span>
          <span class="option-text">${escapeHtml(option.text)}</span>
        </button>
      `
    }).join("")

    const feedback = showFeedback ? `
      <section class="feedback-card ${answer.correct ? "right" : "wrong"}">
        <h3 class="feedback-title">${answer.correct ? "回答正确" : "回答错误"}</h3>
        <p class="feedback-line">你的答案：${escapeHtml(core.formatAnswer(question, answer.selected))}</p>
        <p class="feedback-line">正确答案：${escapeHtml(core.formatAnswer(question, question.answer))}</p>
        <p class="feedback-line">知识点：${escapeHtml(question.knowledgePoint)}</p>
        <p class="feedback-explain">${escapeHtml(question.explanation)}</p>
      </section>
    ` : ""

    const actionButtons = config.instantFeedback
      ? renderQuickActions(isFirst, isLast, canSubmit, answer.submitted)
      : renderExamActions(isFirst, isLast)

    root.innerHTML = `
      <section class="quiz-header">
        <div>
          <h1 class="mode-title">${escapeHtml(config.title)}</h1>
          <p class="mode-tip">${escapeHtml(config.description)}</p>
        </div>
        <div class="progress-pill">${currentIndex + 1} / ${questions.length}</div>
      </section>

      <div class="progress-track" aria-hidden="true">
        <div class="progress-fill" style="width: ${progressPercent}%;"></div>
      </div>

      <section class="tool-row" aria-label="答题工具">
        <button type="button" class="tool-button" data-action="toggle-panel">题号 ${answeredCount}/${questions.length}</button>
        <button type="button" class="tool-button ${isCurrentMarked ? "marked" : ""}" data-action="toggle-mark">
          ${isCurrentMarked ? "取消标记" : "标记本题"}
        </button>
      </section>

      ${session.showQuestionPanel ? `
        <section class="question-panel">
          <div class="panel-head">
            <span>快速选题号</span>
            <span>已标记 ${markedCount} 题</span>
          </div>
          <div class="number-grid">${navItems}</div>
          <div class="legend-row">
            <span>红框当前题</span>
            <span>金底已作答</span>
            <span>角标为已标记</span>
          </div>
        </section>
      ` : ""}

      <article class="question-card">
        <div class="question-meta">
          <span class="type-badge">${escapeHtml(currentQuestion.typeLabel)}</span>
          <span class="category-badge">${escapeHtml(currentQuestion.categoryLabel)}</span>
          ${isCurrentMarked ? "<span class=\"mark-badge\">已标记</span>" : ""}
        </div>
        <h2 class="question-stem">${escapeHtml(currentQuestion.stem)}</h2>
        <div class="option-list">${optionItems}</div>
        ${feedback}
      </article>

      <section class="action-row">
        ${actionButtons}
      </section>
    `
  }

  function renderQuickActions(isFirst, isLast, canSubmit, submitted) {
    if (!submitted) {
      return `
        <button type="button" class="ghost-button nav-button" data-action="prev-question" ${isFirst ? "disabled" : ""}>上一题</button>
        <button type="button" class="primary-button submit-button" data-action="submit-question" ${canSubmit ? "" : "disabled"}>提交本题</button>
      `
    }

    return `
      <button type="button" class="ghost-button nav-button" data-action="prev-question" ${isFirst ? "disabled" : ""}>上一题</button>
      <button type="button" class="primary-button submit-button" data-action="${isLast ? "finish-quiz" : "next-question"}">${isLast ? "查看结果" : "下一题"}</button>
    `
  }

  function renderExamActions(isFirst, isLast) {
    return `
      <button type="button" class="ghost-button nav-button" data-action="prev-question" ${isFirst ? "disabled" : ""}>上一题</button>
      <button type="button" class="primary-button submit-button" data-action="${isLast ? "finish-quiz" : "next-question"}">${isLast ? "提交试卷" : "下一题"}</button>
    `
  }

  function renderResultRoute(mode) {
    const result = readStorage(RESULT_KEY)
    renderResult(result, mode)
    if (result) clearSession()
  }

  function renderResult(result, mode) {
    if (!result) {
      root.innerHTML = `
        <section class="panel empty-panel">
          <h1 class="empty-title">暂无成绩</h1>
          <p class="muted">请先完成一次刷题。</p>
          <button type="button" class="primary-button" data-action="go-home">返回首页</button>
        </section>
      `
      return
    }

    const activeIndex = app.activeMistakeIndex
    const mistakeNav = result.mistakes.map((item) => `
      <button type="button" class="mistake-number ${activeIndex === item.index ? "active" : ""}" data-action="toggle-mistake" data-index="${item.index}">
        ${item.index}
      </button>
    `).join("")

    const activeMistake = result.mistakes.find((item) => item.index === activeIndex)
    const mistakeCard = activeMistake ? `
      <article id="mistake-${activeMistake.index}" class="mistake-card">
        <div class="mistake-head">
          <span>第${activeMistake.index}题 · ${escapeHtml(activeMistake.typeLabel)}</span>
          <span>${escapeHtml(activeMistake.categoryLabel)}</span>
        </div>
        <h3 class="mistake-stem">${escapeHtml(activeMistake.stem)}</h3>
        <p class="answer-line wrong-answer">你的答案：${escapeHtml(activeMistake.selectedText)}</p>
        <p class="answer-line right-answer">正确答案：${escapeHtml(activeMistake.answerText)}</p>
        <p class="knowledge-line">知识点：${escapeHtml(activeMistake.knowledgePoint)}</p>
        <p class="explain-line">${escapeHtml(activeMistake.explanation)}</p>
      </article>
    ` : ""

    root.innerHTML = `
      <section class="score-hero">
        <p class="result-mode">${escapeHtml(result.title)}</p>
        <h1 class="score-number">${result.percent}</h1>
        <p class="score-label">总分 / 正确率</p>
        <p class="honor-pill">${escapeHtml(result.honor)}</p>
        <p class="score-summary">答对 ${result.correctCount} 题，答错 ${result.wrongCount} 题，共 ${result.total} 题。</p>
      </section>

      <section class="panel">
        <h2 class="section-title">薄弱点建议</h2>
        ${result.mistakes.length ? `
          <div class="weak-list">
            ${result.weakCategories.map((item) => `
              <div class="weak-item">
                <span>${escapeHtml(item.label)}</span>
                <span>${item.wrong} / ${item.total} 错</span>
              </div>
            `).join("")}
          </div>
          <div class="advice-list">
            ${result.advice.map((item) => `<p class="advice-item">${escapeHtml(item)}</p>`).join("")}
          </div>
        ` : "<p class=\"success-note\">本次没有错题，继续保持。</p>"}
      </section>

      <section class="panel">
        <h2 class="section-title">错题回看</h2>
        ${result.mistakes.length ? `
          <div class="mistake-nav">${mistakeNav}</div>
          <p class="mistake-tip">点击题号展开对应错题，再点一次可收起。</p>
          ${mistakeCard}
        ` : "<p class=\"muted\">没有错题可回看。</p>"}
      </section>

      <section class="result-actions">
        <button type="button" class="ghost-button" data-action="go-home">返回首页</button>
        <button type="button" class="primary-button" data-action="retry-mode" data-mode="${escapeHtml(result.mode || mode || "quick")}">再练一次</button>
      </section>
    `
  }

  function getSessionOrWarn() {
    const session = loadSession()
    if (!session) {
      window.alert("当前答题状态已失效，请重新开始。")
      navigate("#/", { allowLeave: true })
      return null
    }
    return session
  }

  function selectOption(key) {
    const session = getSessionOrWarn()
    if (!session) return
    const question = session.questions[session.currentIndex]
    const answer = session.answers[session.currentIndex]
    const config = core.getModeConfig(session.mode)
    if (!question || !answer) return
    if (config.instantFeedback && answer.submitted) return

    if (question.type === "single") {
      answer.selected = [key]
    } else if (answer.selected.indexOf(key) >= 0) {
      answer.selected = answer.selected.filter((item) => item !== key)
    } else {
      answer.selected = answer.selected.concat(key)
    }

    saveSession(session)
    renderQuiz(session)
  }

  function submitQuestion() {
    const session = getSessionOrWarn()
    if (!session) return
    const question = session.questions[session.currentIndex]
    const answer = session.answers[session.currentIndex]
    if (!answer.selected.length) {
      window.alert("请选择答案")
      return
    }
    answer.submitted = true
    answer.correct = core.scoreQuestion(question, answer.selected)
    saveSession(session)
    renderQuiz(session)
  }

  function moveQuestion(offset) {
    const session = getSessionOrWarn()
    if (!session) return
    const nextIndex = session.currentIndex + offset
    if (nextIndex < 0 || nextIndex >= session.questions.length) return
    session.currentIndex = nextIndex
    session.showQuestionPanel = false
    saveSession(session)
    renderQuiz(session)
  }

  function jumpQuestion(index) {
    const session = getSessionOrWarn()
    if (!session) return
    if (Number.isNaN(index) || index < 0 || index >= session.questions.length) return
    session.currentIndex = index
    session.showQuestionPanel = false
    saveSession(session)
    renderQuiz(session)
  }

  function togglePanel() {
    const session = getSessionOrWarn()
    if (!session) return
    session.showQuestionPanel = !session.showQuestionPanel
    saveSession(session)
    renderQuiz(session)
  }

  function toggleMark() {
    const session = getSessionOrWarn()
    if (!session) return
    session.marks[session.currentIndex] = !session.marks[session.currentIndex]
    saveSession(session)
    renderQuiz(session)
  }

  function finishQuiz() {
    const session = getSessionOrWarn()
    if (!session) return
    const config = core.getModeConfig(session.mode)

    if (config.instantFeedback) {
      const unsubmittedIndex = session.answers.findIndex((answer) => !answer.submitted)
      if (unsubmittedIndex >= 0) {
        window.alert(`第${unsubmittedIndex + 1}题未提交`)
        session.currentIndex = unsubmittedIndex
        session.showQuestionPanel = false
        saveSession(session)
        renderQuiz(session)
        return
      }
      finalizeQuiz(session)
      return
    }

    const unansweredCount = session.answers.filter((answer) => !answer.selected.length).length
    const message = unansweredCount
      ? `还有${unansweredCount}题未作答，未作答将按错误处理。是否仍然交卷？`
      : "提交后将不能再修改答案，是否确认交卷？"
    if (!window.confirm(message)) {
      session.showQuestionPanel = true
      saveSession(session)
      renderQuiz(session)
      return
    }
    finalizeQuiz(session)
  }

  function finalizeQuiz(session) {
    const result = core.calculateResult(session.mode, session.questions, session.answers)
    session.completed = true
    saveSession(session)
    if (!writeStorage(RESULT_KEY, result)) return
    navigate(`#/result?mode=${session.mode}`, { allowLeave: true })
  }

  function handleClick(event) {
    const target = event.target.closest("[data-action]")
    if (!target || !root.contains(target) || target.disabled) return

    const action = target.dataset.action
    if (action === "start-quiz") startQuiz(target.dataset.mode || "quick")
    if (action === "go-home") {
      clearResult()
      navigate("#/", { allowLeave: true })
    }
    if (action === "select-option") selectOption(target.dataset.key)
    if (action === "submit-question") submitQuestion()
    if (action === "prev-question") moveQuestion(-1)
    if (action === "next-question") moveQuestion(1)
    if (action === "toggle-panel") togglePanel()
    if (action === "toggle-mark") toggleMark()
    if (action === "jump-question") jumpQuestion(Number(target.dataset.index))
    if (action === "finish-quiz") finishQuiz()
    if (action === "retry-mode") startQuiz(target.dataset.mode || "quick")
    if (action === "toggle-mistake") {
      const index = Number(target.dataset.index)
      app.activeMistakeIndex = app.activeMistakeIndex === index ? null : index
      renderResult(readStorage(RESULT_KEY), parseRoute(app.routeHash).mode)
      if (app.activeMistakeIndex !== null) {
        window.setTimeout(() => {
          const node = document.getElementById(`mistake-${app.activeMistakeIndex}`)
          if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
        }, 0)
      }
    }
  }

  setAppHeight()
  window.addEventListener("resize", setAppHeight)
  window.addEventListener("orientationchange", setAppHeight)
  window.addEventListener("hashchange", onHashChange)
  root.addEventListener("click", handleClick)
  renderRoute()
}())

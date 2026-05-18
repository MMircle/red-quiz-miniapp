const { validateQuestionBank } = require("../../utils/quiz")

Page({
  data: {
    validation: {
      ok: true,
      errors: [],
      counts: {
        all: 0,
        single: 0,
        multiple: 0
      }
    }
  },

  onLoad() {
    this.setData({
      validation: validateQuestionBank()
    })
  },

  startQuick() {
    this.startMode("quick")
  },

  startExam() {
    this.startMode("exam")
  },

  startMode(mode) {
    const validation = validateQuestionBank()
    if (!validation.ok) {
      wx.showModal({
        title: "题库校验未通过",
        content: validation.errors.slice(0, 3).join("\n"),
        showCancel: false
      })
      return
    }

    wx.navigateTo({
      url: `/pages/quiz/quiz?mode=${mode}`
    })
  }
})

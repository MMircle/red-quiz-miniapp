Page({
  data: {
    mode: "quick",
    result: null,
    activeMistakeIndex: null
  },

  onLoad(query) {
    const result = getApp().globalData.lastResult
    this.setData({
      mode: query.mode || (result ? result.mode : "quick"),
      result,
      activeMistakeIndex: null
    })
  },

  goHome() {
    wx.reLaunch({
      url: "/pages/index/index"
    })
  },

  retryMode() {
    wx.redirectTo({
      url: `/pages/quiz/quiz?mode=${this.data.mode}`
    })
  },

  jumpToMistake(event) {
    const index = event.currentTarget.dataset.index
    const nextIndex = this.data.activeMistakeIndex === index ? null : index
    this.setData({
      activeMistakeIndex: nextIndex
    })

    if (nextIndex !== null) {
      wx.nextTick(() => {
        wx.pageScrollTo({
          selector: `#mistake-${index}`,
          duration: 240,
          offsetTop: 16
        })
      })
    }
  }
})

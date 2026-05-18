Page({
  data: {
    mode: "quick",
    result: null
  },

  onLoad(query) {
    const result = getApp().globalData.lastResult
    this.setData({
      mode: query.mode || (result ? result.mode : "quick"),
      result
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
  }
})

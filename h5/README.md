# 随手刷题 H5

这是独立静态 H5 版本，可直接部署 `h5/` 目录，不影响微信小程序。

## 本地预览

直接打开 `h5/index.html` 即可预览。若部署到服务器，入口为 `index.html`，路由使用 hash：

- `#/`
- `#/quiz?mode=quick`
- `#/quiz?mode=exam`
- `#/result?mode=quick`
- `#/result?mode=exam`

## 状态存储

- 进行中的答题状态写入 `localStorage` 的 `quiz_session`。
- 交卷结果写入 `quiz_result`。
- 结果页成功渲染后会清除 `quiz_session`。
- 新开一次练习会覆盖旧的 `quiz_session` 和 `quiz_result`。

## 部署注意

- 面向微信内置浏览器分享时必须使用 HTTPS。
- 题库更新后，同步更新 `index.html` 中 `question-bank.js?v=20260518` 的版本号，避免用户命中旧缓存。
- 页面已避免关键操作依赖 `position: fixed`，并使用 `100dvh` 与 `--app-height` 兼容移动 WebView 高度。

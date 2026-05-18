const partyBasicQuestions = require("./questions/partyBasic")
const foundingSpiritQuestions = require("./questions/foundingSpirit")
const fourHistoriesQuestions = require("./questions/fourHistories")
const sysuRedHistoryQuestions = require("./questions/sysuRedHistory")

const categoryLabels = {
  "partyBasic": "党的基础知识",
  "foundingSpirit": "建党精神",
  "fourHistories": "“四史”学习",
  "sysuRedHistory": "中大红色校史"
}

const questions = partyBasicQuestions
  .concat(foundingSpiritQuestions)
  .concat(fourHistoriesQuestions)
  .concat(sysuRedHistoryQuestions)

module.exports = {
  categoryLabels,
  questions
}

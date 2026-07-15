// controllers/aiController.js
const userModel = require("../models/userModel");

function spendCredit(req, res) {
  if (req.user.aiCredits <= 0) {
    res.status(401).json({ error: "not enough AI credits" });
    return false;
  }
  userModel.update(req.user, { aiCredits: req.user.aiCredits - 1 });
  return true;
}

function improve(req, res) {
  const { text, instruction } = req.body;
  if (!text) {
    return res.status(400).json({ error: "text is required" });
  }
  if (req.path === "/prompt" && !instruction) {
    return res.status(400).json({ error: "instruction is required" });
  }
  if (!spendCredit(req, res)) return;

  res.status(200).json({ result: `${text} (improved)`, creditsRemaining: req.user.aiCredits });
}

module.exports = { improve };

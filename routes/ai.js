// routes/ai.js
// mock AI - real model calls come in a later module.
// each call costs one AI credit, and that spend is persisted so it
// survives a server restart (otherwise "credits" would mean nothing).
const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

function spendCredit(req, res) {
  if (req.user.aiCredits <= 0) {
    res.status(401).json({ error: "not enough AI credits" });
    return false;
  }
  req.user.aiCredits -= 1;
  db.save();
  return true;
}

// POST /api/ai/bullets
router.post("/bullets", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  if (!spendCredit(req, res)) return;

  res.status(200).json({ result: `${text} (improved)`, creditsRemaining: req.user.aiCredits });
});

// POST /api/ai/summary
router.post("/summary", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  if (!spendCredit(req, res)) return;

  res.status(200).json({ result: `${text} (improved)`, creditsRemaining: req.user.aiCredits });
});

// POST /api/ai/rewrite
router.post("/rewrite", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  if (!spendCredit(req, res)) return;

  res.status(200).json({ result: `${text} (improved)`, creditsRemaining: req.user.aiCredits });
});

// POST /api/ai/prompt
router.post("/prompt", (req, res) => {
  const { text, instruction } = req.body;
  if (!text || !instruction) {
    return res.status(400).json({ error: "text and instruction are required" });
  }
  if (!spendCredit(req, res)) return;

  res.status(200).json({ result: `${text} (improved)`, creditsRemaining: req.user.aiCredits });
});

module.exports = router;

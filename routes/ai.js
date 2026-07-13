// routes/ai.js
// no real AI yet - each route validates input and returns a mock response
// so the frontend can build against the real shape. every successful call
// costs one mock "AI credit" off the current user, so the metering shape
// is there too.

const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

function spendCredit(req, res) {
  const user = db.data.users.find((u) => u.id === req.user.id);
  if (!user) {
    res.status(404).json({ error: "user not found" });
    return false;
  }
  if (user.aiCredits <= 0) {
    res.status(401).json({ error: "no AI credits remaining, upgrade your plan" });
    return false;
  }
  user.aiCredits -= 1;
  db.save();
  return true;
}

// POST /api/ai/bullets - generate or improve bullet points
router.post("/bullets", (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });
  if (!spendCredit(req, res)) return;

  res.status(200).json({
    input: text,
    output: [`${text} (improved)`, `${text} (rewritten with stronger action verbs)`]
  });
});

// POST /api/ai/summary - generate a summary or headline
router.post("/summary", (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });
  if (!spendCredit(req, res)) return;

  res.status(200).json({ input: text, output: `${text} (improved)` });
});

// POST /api/ai/rewrite - tighten or improve selected text
router.post("/rewrite", (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: "text is required" });
  if (!spendCredit(req, res)) return;

  res.status(200).json({ input: text, output: `${text} (improved)` });
});

// POST /api/ai/prompt - apply a freeform instruction to a section
router.post("/prompt", (req, res) => {
  const { text, instruction } = req.body || {};
  if (!text || !instruction) {
    return res.status(400).json({ error: "text and instruction are required" });
  }
  if (!spendCredit(req, res)) return;

  res.status(200).json({
    input: text,
    instruction,
    output: `${text} (improved based on: "${instruction}")`
  });
});

module.exports = router;

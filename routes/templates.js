// routes/templates.js

const express = require("express");
const router = express.Router();
const db = require("../db");

// GET /api/templates - list available designs
router.get("/", (req, res) => {
  res.status(200).json(db.data.templates);
});

// GET /api/templates/:id - one template's config
router.get("/:id", (req, res) => {
  const template = db.data.templates.find((t) => t.id === req.params.id);
  if (!template) return res.status(404).json({ error: "template not found" });
  res.status(200).json(template);
});

module.exports = router;

// routes/users.js

const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

// GET /api/users/me - current profile, tier, AI credits
router.get("/me", (req, res) => {
  const { password, ...safeUser } = req.user;
  res.status(200).json(safeUser);
});

// PUT /api/users/me - update profile
router.put("/me", (req, res) => {
  const { name, email } = req.body || {};

  if (!name && !email) {
    return res.status(400).json({ error: "provide at least one field to update" });
  }

  const user = db.data.users.find((u) => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: "user not found" });
  }

  if (name) user.name = name;
  if (email) user.email = email;
  db.save();

  const { password, ...safeUser } = user;
  res.status(200).json(safeUser);
});

// DELETE /api/users/me - delete account and data
router.delete("/me", (req, res) => {
  const userId = req.user.id;

  db.data.users = db.data.users.filter((u) => u.id !== userId);
  db.data.documents = db.data.documents.filter((d) => d.userId !== userId);
  db.data.applications = db.data.applications.filter((a) => a.userId !== userId);
  db.data.sessions = db.data.sessions.filter((s) => s.userId !== userId);
  db.save();

  res.status(204).send();
});

module.exports = router;

// routes/users.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

// GET /api/users/me
router.get("/me", (req, res) => {
  const { password, resetToken, ...safeUser } = req.user;
  res.status(200).json(safeUser);
});

// PUT /api/users/me
router.put("/me", (req, res) => {
  const { name, email } = req.body;

  if (name !== undefined) req.user.name = name;
  if (email !== undefined) req.user.email = email;

  db.save();

  const { password, resetToken, ...safeUser } = req.user;
  res.status(200).json(safeUser);
});

// DELETE /api/users/me
router.delete("/me", (req, res) => {
  const userId = req.user.id;

  db.data.users = db.data.users.filter((u) => u.id !== userId);
  db.data.documents = db.data.documents.filter((d) => d.userId !== userId);
  db.data.applications = db.data.applications.filter((a) => a.userId !== userId);

  db.save();

  res.status(204).send();
});

module.exports = router;

// routes/applications.js
// the job tracker - each tracked application belongs to the current user.

const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

// GET /api/applications - list tracked applications
router.get("/", (req, res) => {
  const apps = db.data.applications.filter((a) => a.userId === req.user.id);
  res.status(200).json(apps);
});

// POST /api/applications - log one
router.post("/", (req, res) => {
  const { company, role, status, appliedDate, notes } = req.body || {};
  if (!company || !role) {
    return res.status(400).json({ error: "company and role are required" });
  }

  const app = {
    id: db.makeId("a"),
    userId: req.user.id,
    company,
    role,
    status: status || "applied",
    appliedDate: appliedDate || new Date().toISOString().slice(0, 10),
    notes: notes || ""
  };

  db.data.applications.push(app);
  db.save();
  res.status(201).json(app);
});

// PATCH /api/applications/:id - update status
router.patch("/:id", (req, res) => {
  const app = db.data.applications.find(
    (a) => a.id === req.params.id && a.userId === req.user.id
  );
  if (!app) return res.status(404).json({ error: "application not found" });

  const { status, notes, company, role } = req.body || {};
  if (status !== undefined) app.status = status;
  if (notes !== undefined) app.notes = notes;
  if (company !== undefined) app.company = company;
  if (role !== undefined) app.role = role;

  db.save();
  res.status(200).json(app);
});

// DELETE /api/applications/:id - remove one
router.delete("/:id", (req, res) => {
  const exists = db.data.applications.some(
    (a) => a.id === req.params.id && a.userId === req.user.id
  );
  if (!exists) return res.status(404).json({ error: "application not found" });

  db.data.applications = db.data.applications.filter((a) => a.id !== req.params.id);
  db.save();
  res.status(204).send();
});

module.exports = router;

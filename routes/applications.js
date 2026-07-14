// routes/applications.js
const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

// GET /api/applications
router.get("/", (req, res) => {
  const apps = db.data.applications.filter((a) => a.userId === req.user.id);
  res.status(200).json(apps);
});

// POST /api/applications
router.post("/", (req, res) => {
  const { company, role, status } = req.body;

  if (!company || !role) {
    return res.status(400).json({ error: "company and role are required" });
  }

  const newApp = {
    id: db.makeId("app"),
    userId: req.user.id,
    company,
    role,
    status: status || "applied",
    appliedDate: new Date().toISOString()
  };

  db.data.applications.push(newApp);
  db.save();

  res.status(201).json(newApp);
});

// PATCH /api/applications/:id
router.patch("/:id", (req, res) => {
  const app = db.data.applications.find(
    (a) => a.id === req.params.id && a.userId === req.user.id
  );
  if (!app) {
    return res.status(404).json({ error: "application not found" });
  }

  const { status, company, role } = req.body;
  if (status !== undefined) app.status = status;
  if (company !== undefined) app.company = company;
  if (role !== undefined) app.role = role;

  db.save();
  res.status(200).json(app);
});

// DELETE /api/applications/:id
router.delete("/:id", (req, res) => {
  const before = db.data.applications.length;
  db.data.applications = db.data.applications.filter(
    (a) => !(a.id === req.params.id && a.userId === req.user.id)
  );

  if (db.data.applications.length === before) {
    return res.status(404).json({ error: "application not found" });
  }

  db.save();
  res.status(204).send();
});

module.exports = router;

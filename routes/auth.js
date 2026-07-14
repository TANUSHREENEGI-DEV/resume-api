// routes/auth.js
// mock auth - no real password hashing or tokens yet, that's a later module.
// what matters today: every route touches data.json through db.save().
const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  const exists = db.data.users.find((u) => u.email === email);
  if (exists) {
    return res.status(400).json({ error: "an account with this email already exists" });
  }

  const newUser = {
    id: db.makeId("u"),
    name,
    email,
    password, // plaintext for now - real hashing comes with real auth
    tier: "free",
    aiCredits: 5,
    createdAt: new Date().toISOString()
  };

  db.data.users.push(newUser);
  db.save();

  const { password: _pw, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  const user = db.data.users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  // mock token - real JWT comes later
  const token = `mock-token-${user.id}`;
  res.status(200).json({ token, userId: user.id });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  // no real sessions to invalidate yet, but the route exists and responds correctly
  res.status(200).json({ message: "logged out" });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const user = db.data.users.find((u) => u.email === email);
  if (!user) {
    // don't reveal whether the email exists - standard practice
    return res.status(200).json({ message: "if that account exists, a reset link was sent" });
  }

  const resetToken = db.makeId("reset");
  user.resetToken = resetToken;
  db.save();

  res.status(200).json({ message: "if that account exists, a reset link was sent" });
});

// POST /api/auth/reset-password
router.post("/reset-password", (req, res) => {
  const { resetToken, newPassword } = req.body;

  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "resetToken and newPassword are required" });
  }

  const user = db.data.users.find((u) => u.resetToken === resetToken);
  if (!user) {
    return res.status(400).json({ error: "invalid or expired reset token" });
  }

  user.password = newPassword;
  delete user.resetToken;
  db.save();

  res.status(200).json({ message: "password updated" });
});

module.exports = router;

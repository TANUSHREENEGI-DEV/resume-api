// routes/auth.js
// no real auth yet - these return sensible mock responses so the shapes
// are right for the frontend to build against.

const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /api/auth/register - create account
router.post("/register", (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  const existing = db.data.users.find((u) => u.email === email);
  if (existing) {
    return res.status(400).json({ error: "an account with this email already exists" });
  }

  const newUser = {
    id: db.makeId("u"),
    name,
    email,
    password: "hashed-mock-password", // never store plain text in a real app
    tier: "free",
    aiCredits: 20,
    createdAt: new Date().toISOString()
  };

  db.data.users.push(newUser);
  db.save();

  const { password: _pw, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser, token: `mock-token-${newUser.id}` });
});

// POST /api/auth/login - obtain an access token
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const user = db.data.users.find((u) => u.email === email);
  if (!user) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  // mock check only - no real password hashing yet
  const token = `mock-token-${user.id}`;
  db.data.sessions.push({ token, userId: user.id, createdAt: new Date().toISOString() });
  db.save();

  res.status(200).json({ token, tokenType: "Bearer", expiresIn: 3600 });
});

// POST /api/auth/logout - invalidate the session
router.post("/logout", (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");

  db.data.sessions = db.data.sessions.filter((s) => s.token !== token);
  db.save();

  res.status(200).json({ message: "logged out" });
});

// POST /api/auth/forgot-password - begin password recovery
router.post("/forgot-password", (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  // mock - in a real app this would email a reset link
  res.status(200).json({ message: "if that email exists, a reset link has been sent" });
});

// POST /api/auth/reset-password - complete password reset
router.post("/reset-password", (req, res) => {
  const { token, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: "token and newPassword are required" });
  }

  // mock - would verify the reset token and update the real user's password
  res.status(200).json({ message: "password has been reset" });
});

module.exports = router;

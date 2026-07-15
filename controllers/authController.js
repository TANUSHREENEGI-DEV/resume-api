// controllers/authController.js
const userModel = require("../models/userModel");
const db = require("../db");

function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  if (userModel.findByEmail(email)) {
    return res.status(400).json({ error: "an account with this email already exists" });
  }

  const newUser = userModel.create({ name, email, password });
  const { password: _pw, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser });
}

function login(req, res) {
  const { email, password } = req.body;

  const user = userModel.findByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const token = `mock-token-${user.id}`;
  res.status(200).json({ token, userId: user.id });
}

function logout(req, res) {
  res.status(200).json({ message: "logged out" });
}

function forgotPassword(req, res) {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const user = userModel.findByEmail(email);
  if (user) {
    const resetToken = db.makeId("reset");
    userModel.update(user, { resetToken });
  }

  // don't reveal whether the email exists - same response either way
  res.status(200).json({ message: "if that account exists, a reset link was sent" });
}

function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "resetToken and newPassword are required" });
  }

  const user = userModel.findByResetToken(resetToken);
  if (!user) {
    return res.status(400).json({ error: "invalid or expired reset token" });
  }

  userModel.update(user, { password: newPassword, resetToken: undefined });
  res.status(200).json({ message: "password updated" });
}

module.exports = { register, login, logout, forgotPassword, resetPassword };

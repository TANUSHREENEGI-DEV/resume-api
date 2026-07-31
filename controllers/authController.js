const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userModel = require("../models/userModel");
const db = require("../db");

const SECRET = process.env.JWT_SECRET;

async function register(req, res) {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required" });
  }

  if (userModel.findByEmail(email)) {
    return res.status(400).json({ error: "an account with this email already exists" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUser = userModel.create({ name, email, password: hashedPassword });
  const { password: _pw, ...safeUser } = newUser;

  const token = jwt.sign({ id: newUser.id }, SECRET, { expiresIn: "7d" });
  res.status(201).json({ token, user: safeUser });
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = userModel.findByEmail(email);
  if (!user) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.password);
  if (!passwordMatches) {
    return res.status(401).json({ error: "invalid email or password" });
  }

  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "7d" });
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

  res.status(200).json({ message: "if that account exists, a reset link was sent" });
}

async function resetPassword(req, res) {
  const { resetToken, newPassword } = req.body;
  if (!resetToken || !newPassword) {
    return res.status(400).json({ error: "resetToken and newPassword are required" });
  }

  const user = userModel.findByResetToken(resetToken);
  if (!user) {
    return res.status(400).json({ error: "invalid or expired reset token" });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);

  userModel.update(user, { password: hashedPassword, resetToken: undefined });
  res.status(200).json({ message: "password updated" });
}

module.exports = { register, login, logout, forgotPassword, resetPassword };
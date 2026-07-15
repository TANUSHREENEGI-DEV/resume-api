// controllers/userController.js
const userModel = require("../models/userModel");
const db = require("../db");

function getMe(req, res) {
  const { password, resetToken, ...safeUser } = req.user;
  res.status(200).json(safeUser);
}

function updateMe(req, res) {
  const { name, email } = req.body;
  const changes = {};
  if (name !== undefined) changes.name = name;
  if (email !== undefined) changes.email = email;

  const updated = userModel.update(req.user, changes);
  const { password, resetToken, ...safeUser } = updated;
  res.status(200).json(safeUser);
}

function deleteMe(req, res) {
  const userId = req.user.id;

  userModel.remove(userId);
  db.data.documents = db.data.documents.filter((d) => d.userId !== userId);
  db.data.applications = db.data.applications.filter((a) => a.userId !== userId);
  db.save();

  res.status(204).send();
}

module.exports = { getMe, updateMe, deleteMe };

// models/userModel.js
// everything that touches db.data.users lives here.
// controllers call these functions, they never touch db.data directly.
const db = require("../db");

function findAll() {
  return db.data.users;
}

function findById(id) {
  return db.data.users.find((u) => u.id === id);
}

function findByEmail(email) {
  return db.data.users.find((u) => u.email === email);
}

function findByResetToken(resetToken) {
  return db.data.users.find((u) => u.resetToken === resetToken);
}

function create(userData) {
  const newUser = {
    id: db.makeId("u"),
    tier: "free",
    aiCredits: 5,
    createdAt: new Date().toISOString(),
    ...userData
  };
  db.data.users.push(newUser);
  db.save();
  return newUser;
}

function update(user, changes) {
  Object.assign(user, changes);
  db.save();
  return user;
}

function remove(id) {
  db.data.users = db.data.users.filter((u) => u.id !== id);
  db.save();
}

module.exports = {
  findAll,
  findById,
  findByEmail,
  findByResetToken,
  create,
  update,
  remove
};

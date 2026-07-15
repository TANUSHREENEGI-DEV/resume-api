// models/templateModel.js
// read-only - templates are just seeded in data.json.
const db = require("../db");

function findAll() {
  return db.data.templates;
}

function findById(id) {
  return db.data.templates.find((t) => t.id === id);
}

module.exports = { findAll, findById };

// controllers/templateController.js
const templateModel = require("../models/templateModel");

function list(req, res) {
  res.status(200).json(templateModel.findAll());
}

function getOne(req, res) {
  const template = templateModel.findById(req.params.id);
  if (!template) {
    return res.status(404).json({ error: "template not found" });
  }
  res.status(200).json(template);
}

module.exports = { list, getOne };

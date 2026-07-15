// controllers/applicationController.js
const applicationModel = require("../models/applicationModel");

function list(req, res) {
  res.status(200).json(applicationModel.findAllByUser(req.user.id));
}

function create(req, res) {
  const { company, role, status } = req.body;
  if (!company || !role) {
    return res.status(400).json({ error: "company and role are required" });
  }

  const appData = { userId: req.user.id, company, role };
  if (status !== undefined) appData.status = status;

  const newApp = applicationModel.create(appData);
  res.status(201).json(newApp);
}

function update(req, res) {
  const app = applicationModel.findById(req.params.id, req.user.id);
  if (!app) {
    return res.status(404).json({ error: "application not found" });
  }

  const { status, company, role } = req.body;
  const changes = {};
  if (status !== undefined) changes.status = status;
  if (company !== undefined) changes.company = company;
  if (role !== undefined) changes.role = role;

  res.status(200).json(applicationModel.update(app, changes));
}

function remove(req, res) {
  const removed = applicationModel.remove(req.params.id, req.user.id);
  if (!removed) {
    return res.status(404).json({ error: "application not found" });
  }
  res.status(204).send();
}

module.exports = { list, create, update, remove };

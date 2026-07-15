// models/applicationModel.js
const db = require("../db");

function findAllByUser(userId) {
  return db.data.applications.filter((a) => a.userId === userId);
}

function findById(id, userId) {
  return db.data.applications.find((a) => a.id === id && a.userId === userId);
}

function create(appData) {
  const newApp = {
    id: db.makeId("app"),
    status: "applied",
    appliedDate: new Date().toISOString(),
    ...appData
  };
  db.data.applications.push(newApp);
  db.save();
  return newApp;
}

function update(app, changes) {
  Object.assign(app, changes);
  db.save();
  return app;
}

function remove(id, userId) {
  const before = db.data.applications.length;
  db.data.applications = db.data.applications.filter(
    (a) => !(a.id === id && a.userId === userId)
  );
  db.save();
  return db.data.applications.length !== before;
}

module.exports = { findAllByUser, findById, create, update, remove };

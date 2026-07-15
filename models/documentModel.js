// models/documentModel.js
// everything that touches db.data.documents lives here.
const db = require("../db");

function findAllByUser(userId) {
  return db.data.documents.filter((d) => d.userId === userId);
}

function findById(id, userId) {
  return db.data.documents.find((d) => d.id === id && d.userId === userId);
}

function create(docData) {
  const now = new Date().toISOString();
  const newDoc = {
    id: db.makeId("doc"),
    sections: [],
    versions: [],
    createdAt: now,
    updatedAt: now,
    ...docData
  };
  db.data.documents.push(newDoc);
  db.save();
  return newDoc;
}

function update(doc, changes) {
  Object.assign(doc, changes);
  doc.updatedAt = new Date().toISOString();
  db.save();
  return doc;
}

function remove(id) {
  db.data.documents = db.data.documents.filter((d) => d.id !== id);
  db.save();
}

function touch(doc) {
  doc.updatedAt = new Date().toISOString();
  db.save();
}

// ---------- sections ----------

function findSection(doc, sectionId) {
  return doc.sections.find((s) => s.id === sectionId);
}

function addSection(doc, sectionData) {
  const newSection = {
    id: db.makeId("sec"),
    items: [],
    order: doc.sections.length + 1,
    ...sectionData
  };
  doc.sections.push(newSection);
  touch(doc);
  return newSection;
}

function removeSection(doc, sectionId) {
  const before = doc.sections.length;
  doc.sections = doc.sections.filter((s) => s.id !== sectionId);
  touch(doc);
  return doc.sections.length !== before;
}

// ---------- items ----------

function findItem(section, itemId) {
  return section.items.find((i) => i.id === itemId);
}

function addItem(doc, section, itemData) {
  const newItem = { id: db.makeId("item"), ...itemData };
  section.items.push(newItem);
  touch(doc);
  return newItem;
}

function removeItem(doc, section, itemId) {
  const before = section.items.length;
  section.items = section.items.filter((i) => i.id !== itemId);
  touch(doc);
  return section.items.length !== before;
}

// ---------- versions ----------

function addVersion(doc) {
  const newVersion = {
    id: db.makeId("ver"),
    createdAt: new Date().toISOString(),
    snapshot: JSON.parse(JSON.stringify(doc.sections))
  };
  doc.versions.push(newVersion);
  db.save();
  return newVersion;
}

function findVersion(doc, versionId) {
  return doc.versions.find((v) => v.id === versionId);
}

function restoreVersion(doc, version) {
  doc.sections = JSON.parse(JSON.stringify(version.snapshot));
  touch(doc);
  return doc;
}

module.exports = {
  findAllByUser,
  findById,
  create,
  update,
  remove,
  findSection,
  addSection,
  removeSection,
  findItem,
  addItem,
  removeItem,
  addVersion,
  findVersion,
  restoreVersion
};

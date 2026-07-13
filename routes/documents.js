// routes/documents.js
// documents are the core resource: resumes and cover letters.
// also holds the nested sections/items routes and the versions routes,
// since they all live under /api/documents/:id.

const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

function findDoc(id, userId) {
  return db.data.documents.find((d) => d.id === id && d.userId === userId);
}

// ---------- documents ----------

// GET /api/documents - list my resumes and cover letters
router.get("/", (req, res) => {
  const docs = db.data.documents.filter((d) => d.userId === req.user.id);
  res.status(200).json(docs);
});

// POST /api/documents - create one (blank or from a template)
router.post("/", (req, res) => {
  const { title, type, templateId } = req.body || {};

  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const newDoc = {
    id: db.makeId("d"),
    userId: req.user.id,
    type, // "resume" | "cover-letter"
    title,
    templateId: templateId || null,
    sections: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.data.documents.push(newDoc);
  db.save();
  res.status(201).json(newDoc);
});

// POST /api/documents/import - create one from an upload or LinkedIn data
router.post("/import", (req, res) => {
  const { source, title } = req.body || {};

  if (!source) {
    return res.status(400).json({ error: "source is required (e.g. 'upload' or 'linkedin')" });
  }

  // mock import - a real version would parse the upload / LinkedIn payload
  const newDoc = {
    id: db.makeId("d"),
    userId: req.user.id,
    type: "resume",
    title: title || `Imported from ${source}`,
    templateId: null,
    sections: [
      {
        id: db.makeId("s"),
        type: "summary",
        title: "Summary",
        order: 1,
        items: [{ id: db.makeId("i"), text: `(mock) content imported from ${source}` }]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.data.documents.push(newDoc);
  db.save();
  res.status(201).json(newDoc);
});

// GET /api/documents/:id - read one with its full content
router.get("/:id", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });
  res.status(200).json(doc);
});

// PUT /api/documents/:id - save edits (whole document replace)
router.put("/:id", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const { title, type, templateId, sections } = req.body || {};

  if (title !== undefined) doc.title = title;
  if (type !== undefined) doc.type = type;
  if (templateId !== undefined) doc.templateId = templateId;
  if (sections !== undefined) doc.sections = sections;
  doc.updatedAt = new Date().toISOString();

  db.save();
  res.status(200).json(doc);
});

// POST /api/documents/:id/duplicate - copy it (a tailored version)
router.post("/:id/duplicate", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const copy = {
    ...JSON.parse(JSON.stringify(doc)),
    id: db.makeId("d"),
    title: `${doc.title} (copy)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  db.data.documents.push(copy);
  db.save();
  res.status(201).json(copy);
});

// DELETE /api/documents/:id - delete it
router.delete("/:id", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  db.data.documents = db.data.documents.filter((d) => d.id !== req.params.id);
  db.data.versions = db.data.versions.filter((v) => v.documentId !== req.params.id);
  db.save();
  res.status(204).send();
});

// ---------- sections ----------

// POST /api/documents/:id/sections - add a section
router.post("/:id/sections", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const { type, title, order } = req.body || {};
  if (!type || !title) {
    return res.status(400).json({ error: "type and title are required" });
  }

  const section = {
    id: db.makeId("s"),
    type,
    title,
    order: order ?? doc.sections.length + 1,
    items: []
  };

  doc.sections.push(section);
  doc.updatedAt = new Date().toISOString();
  db.save();
  res.status(201).json(section);
});

// PATCH /api/documents/:id/sections/:sectionId - edit or reorder a section
router.patch("/:id/sections/:sectionId", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) return res.status(404).json({ error: "section not found" });

  const { title, type, order } = req.body || {};
  if (title !== undefined) section.title = title;
  if (type !== undefined) section.type = type;
  if (order !== undefined) section.order = order;
  doc.updatedAt = new Date().toISOString();

  db.save();
  res.status(200).json(section);
});

// DELETE /api/documents/:id/sections/:sectionId - remove a section
router.delete("/:id/sections/:sectionId", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const exists = doc.sections.some((s) => s.id === req.params.sectionId);
  if (!exists) return res.status(404).json({ error: "section not found" });

  doc.sections = doc.sections.filter((s) => s.id !== req.params.sectionId);
  doc.updatedAt = new Date().toISOString();
  db.save();
  res.status(204).send();
});

// ---------- items ----------

// POST /api/documents/:id/sections/:sectionId/items - add an entry
router.post("/:id/sections/:sectionId/items", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) return res.status(404).json({ error: "section not found" });

  const item = { id: db.makeId("i"), ...(req.body || {}) };
  section.items.push(item);
  doc.updatedAt = new Date().toISOString();

  db.save();
  res.status(201).json(item);
});

// PATCH /api/documents/:id/sections/:sectionId/items/:itemId - edit or reorder an entry
router.patch("/:id/sections/:sectionId/items/:itemId", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) return res.status(404).json({ error: "section not found" });

  const item = section.items.find((i) => i.id === req.params.itemId);
  if (!item) return res.status(404).json({ error: "item not found" });

  Object.assign(item, req.body || {});
  doc.updatedAt = new Date().toISOString();

  db.save();
  res.status(200).json(item);
});

// DELETE /api/documents/:id/sections/:sectionId/items/:itemId - remove an entry
router.delete("/:id/sections/:sectionId/items/:itemId", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) return res.status(404).json({ error: "section not found" });

  const exists = section.items.some((i) => i.id === req.params.itemId);
  if (!exists) return res.status(404).json({ error: "item not found" });

  section.items = section.items.filter((i) => i.id !== req.params.itemId);
  doc.updatedAt = new Date().toISOString();
  db.save();
  res.status(204).send();
});

// ---------- versions ----------

// GET /api/documents/:id/versions - list saved versions
router.get("/:id/versions", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const versions = db.data.versions.filter((v) => v.documentId === doc.id);
  res.status(200).json(versions);
});

// POST /api/documents/:id/versions - save the current state as a version
router.post("/:id/versions", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const version = {
    id: db.makeId("v"),
    documentId: doc.id,
    snapshot: JSON.parse(JSON.stringify(doc)),
    createdAt: new Date().toISOString()
  };

  db.data.versions.push(version);
  db.save();
  res.status(201).json(version);
});

// POST /api/documents/:id/versions/:versionId/restore - roll back to one
router.post("/:id/versions/:versionId/restore", (req, res) => {
  const doc = findDoc(req.params.id, req.user.id);
  if (!doc) return res.status(404).json({ error: "document not found" });

  const version = db.data.versions.find(
    (v) => v.id === req.params.versionId && v.documentId === doc.id
  );
  if (!version) return res.status(404).json({ error: "version not found" });

  const { id, userId, createdAt } = doc; // keep identity fields
  Object.assign(doc, version.snapshot, { id, userId, createdAt, updatedAt: new Date().toISOString() });

  db.save();
  res.status(200).json(doc);
});

module.exports = router;

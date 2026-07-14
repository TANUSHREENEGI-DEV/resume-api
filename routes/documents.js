// routes/documents.js
// the core resource. documents own sections, sections own items,
// and documents keep a versions list. every mutation ends with db.save().
const express = require("express");
const router = express.Router();
const db = require("../db");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

function findDocOr404(req, res) {
  const doc = db.data.documents.find(
    (d) => d.id === req.params.id && d.userId === req.user.id
  );
  if (!doc) {
    res.status(404).json({ error: "document not found" });
    return null;
  }
  return doc;
}

// GET /api/documents
router.get("/", (req, res) => {
  const docs = db.data.documents.filter((d) => d.userId === req.user.id);
  res.status(200).json(docs);
});

// POST /api/documents
router.post("/", (req, res) => {
  const { title, type, templateId } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const now = new Date().toISOString();
  const newDoc = {
    id: db.makeId("doc"),
    userId: req.user.id,
    title,
    type,
    templateId: templateId || null,
    sections: [],
    versions: [],
    createdAt: now,
    updatedAt: now
  };

  db.data.documents.push(newDoc);
  db.save();

  res.status(201).json(newDoc);
});

// POST /api/documents/import
router.post("/import", (req, res) => {
  const { title, type, source, content } = req.body;

  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const now = new Date().toISOString();
  const newDoc = {
    id: db.makeId("doc"),
    userId: req.user.id,
    title,
    type,
    templateId: null,
    importedFrom: source || "upload",
    sections: content?.sections || [],
    versions: [],
    createdAt: now,
    updatedAt: now
  };

  db.data.documents.push(newDoc);
  db.save();

  res.status(201).json(newDoc);
});

// GET /api/documents/:id
router.get("/:id", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;
  res.status(200).json(doc);
});

// PUT /api/documents/:id
router.put("/:id", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const { title, sections } = req.body;
  if (title !== undefined) doc.title = title;
  if (sections !== undefined) doc.sections = sections;
  doc.updatedAt = new Date().toISOString();

  db.save();
  res.status(200).json(doc);
});

// POST /api/documents/:id/duplicate
router.post("/:id/duplicate", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const now = new Date().toISOString();
  const copy = {
    ...JSON.parse(JSON.stringify(doc)),
    id: db.makeId("doc"),
    title: `${doc.title} (copy)`,
    createdAt: now,
    updatedAt: now
  };

  db.data.documents.push(copy);
  db.save();

  res.status(201).json(copy);
});

// DELETE /api/documents/:id
router.delete("/:id", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  db.data.documents = db.data.documents.filter((d) => d.id !== doc.id);
  db.save();

  res.status(204).send();
});

// ---------- sections ----------

// POST /api/documents/:id/sections
router.post("/:id/sections", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const { type, title, order } = req.body;
  if (!type || !title) {
    return res.status(400).json({ error: "type and title are required" });
  }

  const newSection = {
    id: db.makeId("sec"),
    type,
    title,
    order: order ?? doc.sections.length + 1,
    items: []
  };

  doc.sections.push(newSection);
  doc.updatedAt = new Date().toISOString();
  db.save();

  res.status(201).json(newSection);
});

// PATCH /api/documents/:id/sections/:sectionId
router.patch("/:id/sections/:sectionId", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const { title, order, type } = req.body;
  if (title !== undefined) section.title = title;
  if (order !== undefined) section.order = order;
  if (type !== undefined) section.type = type;

  doc.updatedAt = new Date().toISOString();
  db.save();

  res.status(200).json(section);
});

// DELETE /api/documents/:id/sections/:sectionId
router.delete("/:id/sections/:sectionId", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const before = doc.sections.length;
  doc.sections = doc.sections.filter((s) => s.id !== req.params.sectionId);

  if (doc.sections.length === before) {
    return res.status(404).json({ error: "section not found" });
  }

  doc.updatedAt = new Date().toISOString();
  db.save();

  res.status(204).send();
});

// ---------- items ----------

// POST /api/documents/:id/sections/:sectionId/items
router.post("/:id/sections/:sectionId/items", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const newItem = { id: db.makeId("item"), ...req.body };
  section.items.push(newItem);
  doc.updatedAt = new Date().toISOString();
  db.save();

  res.status(201).json(newItem);
});

// PATCH /api/documents/:id/sections/:sectionId/items/:itemId
router.patch("/:id/sections/:sectionId/items/:itemId", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const item = section.items.find((i) => i.id === req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: "item not found" });
  }

  Object.assign(item, req.body);
  doc.updatedAt = new Date().toISOString();
  db.save();

  res.status(200).json(item);
});

// DELETE /api/documents/:id/sections/:sectionId/items/:itemId
router.delete("/:id/sections/:sectionId/items/:itemId", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const section = doc.sections.find((s) => s.id === req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const before = section.items.length;
  section.items = section.items.filter((i) => i.id !== req.params.itemId);

  if (section.items.length === before) {
    return res.status(404).json({ error: "item not found" });
  }

  doc.updatedAt = new Date().toISOString();
  db.save();

  res.status(204).send();
});

// ---------- versions ----------

// GET /api/documents/:id/versions
router.get("/:id/versions", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;
  res.status(200).json(doc.versions);
});

// POST /api/documents/:id/versions
router.post("/:id/versions", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const newVersion = {
    id: db.makeId("ver"),
    createdAt: new Date().toISOString(),
    snapshot: JSON.parse(JSON.stringify(doc.sections))
  };

  doc.versions.push(newVersion);
  db.save();

  res.status(201).json(newVersion);
});

// POST /api/documents/:id/versions/:versionId/restore
router.post("/:id/versions/:versionId/restore", (req, res) => {
  const doc = findDocOr404(req, res);
  if (!doc) return;

  const version = doc.versions.find((v) => v.id === req.params.versionId);
  if (!version) {
    return res.status(404).json({ error: "version not found" });
  }

  doc.sections = JSON.parse(JSON.stringify(version.snapshot));
  doc.updatedAt = new Date().toISOString();
  db.save();

  res.status(200).json(doc);
});

module.exports = router;

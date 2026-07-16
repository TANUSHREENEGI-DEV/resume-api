// controllers/documentController.js
const documentModel = require("../models/documentModel");

// GET /api/documents/hello
function hello(req, res) {
  res.json({ message: "Hello from documents" });
}

function getDocOr404(req, res) {
  const doc = documentModel.findById(req.params.id, req.user.id);
  if (!doc) {
    res.status(404).json({ error: "document not found" });
    return null;
  }
  return doc;
}

// GET /api/documents
function list(req, res) {
  res.status(200).json(documentModel.findAllByUser(req.user.id));
}

// POST /api/documents
function create(req, res) {
  const { title, type, templateId } = req.body;
  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const newDoc = documentModel.create({
    userId: req.user.id,
    title,
    type,
    templateId: templateId || null
  });
  res.status(201).json(newDoc);
}

// POST /api/documents/import
function importDoc(req, res) {
  const { title, type, source, content } = req.body;
  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const newDoc = documentModel.create({
    userId: req.user.id,
    title,
    type,
    templateId: null,
    importedFrom: source || "upload",
    sections: content?.sections || []
  });
  res.status(201).json(newDoc);
}

// GET /api/documents/:id
function getOne(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;
  res.status(200).json(doc);
}

// PUT /api/documents/:id
function update(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const { title, sections } = req.body;
  const changes = {};
  if (title !== undefined) changes.title = title;
  if (sections !== undefined) changes.sections = sections;

  res.status(200).json(documentModel.update(doc, changes));
}

// POST /api/documents/:id/duplicate
function duplicate(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const cloned = JSON.parse(JSON.stringify(doc));
  delete cloned.id;
  delete cloned.createdAt;
  delete cloned.updatedAt;

  const copy = documentModel.create({
    ...cloned,
    title: `${doc.title} (copy)`
  });
  res.status(201).json(copy);
}

// DELETE /api/documents/:id
function remove(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  documentModel.remove(doc.id);
  res.status(204).send();
}

// ---------- sections ----------

function addSection(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const { type, title, order } = req.body;
  if (!type || !title) {
    return res.status(400).json({ error: "type and title are required" });
  }

  const newSection = documentModel.addSection(doc, { type, title, order });
  res.status(201).json(newSection);
}

function updateSection(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const section = documentModel.findSection(doc, req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const { title, order, type } = req.body;
  if (title !== undefined) section.title = title;
  if (order !== undefined) section.order = order;
  if (type !== undefined) section.type = type;

  documentModel.update(doc, {});
  res.status(200).json(section);
}

function removeSection(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const removed = documentModel.removeSection(doc, req.params.sectionId);
  if (!removed) {
    return res.status(404).json({ error: "section not found" });
  }
  res.status(204).send();
}

// ---------- items ----------

function addItem(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const section = documentModel.findSection(doc, req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const newItem = documentModel.addItem(doc, section, req.body);
  res.status(201).json(newItem);
}

function updateItem(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const section = documentModel.findSection(doc, req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const item = documentModel.findItem(section, req.params.itemId);
  if (!item) {
    return res.status(404).json({ error: "item not found" });
  }

  Object.assign(item, req.body);
  documentModel.update(doc, {});
  res.status(200).json(item);
}

function removeItem(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const section = documentModel.findSection(doc, req.params.sectionId);
  if (!section) {
    return res.status(404).json({ error: "section not found" });
  }

  const removed = documentModel.removeItem(doc, section, req.params.itemId);
  if (!removed) {
    return res.status(404).json({ error: "item not found" });
  }
  res.status(204).send();
}

// ---------- versions ----------

function listVersions(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;
  res.status(200).json(doc.versions);
}

function createVersion(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const newVersion = documentModel.addVersion(doc);
  res.status(201).json(newVersion);
}

function restoreVersion(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const version = documentModel.findVersion(doc, req.params.versionId);
  if (!version) {
    return res.status(404).json({ error: "version not found" });
  }

  res.status(200).json(documentModel.restoreVersion(doc, version));
}

module.exports = {
  hello,
  list,
  create,
  importDoc,
  getOne,
  update,
  duplicate,
  remove,
  addSection,
  updateSection,
  removeSection,
  addItem,
  updateItem,
  removeItem,
  listVersions,
  createVersion,
  restoreVersion
};

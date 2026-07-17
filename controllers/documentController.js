const documentModel = require("../models/documentModel");

function hello(req, res) {
  res.json({ message: "Hello from Tanushree" });
}

function getDocOr404(req, res) {
  const doc = documentModel.findById(req.params.id, req.user.id);
  if (!doc) {
    res.status(404).json({ error: "document not found" });
    return null;
  }
  return doc;
}

function list(req, res) {
  res.status(200).json(documentModel.findAllByUser(req.user.id));
}

function create(req, res) {
  const title = req.body.title;
  const type = req.body.type;
  const templateId = req.body.templateId;

  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const newDoc = documentModel.create({
    userId: req.user.id,
    title: title,
    type: type,
    templateId: templateId || null
  });

  res.status(201).json(newDoc);
}

function importDoc(req, res) {
  const title = req.body.title;
  const type = req.body.type;
  const source = req.body.source;
  const content = req.body.content;

  if (!title || !type) {
    return res.status(400).json({ error: "title and type are required" });
  }

  const sections = content && content.sections ? content.sections : [];

  const newDoc = documentModel.create({
    userId: req.user.id,
    title: title,
    type: type,
    templateId: null,
    importedFrom: source || "upload",
    sections: sections
  });

  res.status(201).json(newDoc);
}

function getOne(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;
  res.status(200).json(doc);
}

function update(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const changes = {};
  if (req.body.title !== undefined) changes.title = req.body.title;
  if (req.body.sections !== undefined) changes.sections = req.body.sections;

  res.status(200).json(documentModel.update(doc, changes));
}

function duplicate(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const cloned = JSON.parse(JSON.stringify(doc));
  delete cloned.id;
  delete cloned.createdAt;
  delete cloned.updatedAt;
  cloned.title = doc.title + " (copy)";

  const copy = documentModel.create(cloned);
  res.status(201).json(copy);
}

function remove(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  documentModel.remove(doc.id);
  res.status(204).send();
}

function addSection(req, res) {
  const doc = getDocOr404(req, res);
  if (!doc) return;

  const type = req.body.type;
  const title = req.body.title;
  const order = req.body.order;

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

  if (req.body.title !== undefined) section.title = req.body.title;
  if (req.body.order !== undefined) section.order = req.body.order;
  if (req.body.type !== undefined) section.type = req.body.type;

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

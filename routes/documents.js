const express = require("express");
const router = express.Router();
const controller = require("../controllers/documentController");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

router.get("/hello", controller.hello);

router.get("/", controller.list);
router.post("/", controller.create);
router.post("/import", controller.importDoc);
router.get("/:id", controller.getOne);
router.put("/:id", controller.update);
router.post("/:id/duplicate", controller.duplicate);
router.delete("/:id", controller.remove);

router.post("/:id/sections", controller.addSection);
router.patch("/:id/sections/:sectionId", controller.updateSection);
router.delete("/:id/sections/:sectionId", controller.removeSection);

router.post("/:id/sections/:sectionId/items", controller.addItem);
router.patch("/:id/sections/:sectionId/items/:itemId", controller.updateItem);
router.delete("/:id/sections/:sectionId/items/:itemId", controller.removeItem);

router.get("/:id/versions", controller.listVersions);
router.post("/:id/versions", controller.createVersion);
router.post("/:id/versions/:versionId/restore", controller.restoreVersion);

module.exports = router;

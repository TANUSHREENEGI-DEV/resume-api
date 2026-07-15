// routes/applications.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/applicationController");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.patch("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;

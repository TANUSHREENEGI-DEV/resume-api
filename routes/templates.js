// routes/templates.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/templateController");

router.get("/", controller.list);
router.get("/:id", controller.getOne);

module.exports = router;

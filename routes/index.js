const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/users", require("./users"));
router.use("/documents", require("./documents"));
router.use("/templates", require("./templates"));
router.use("/ai", require("./ai"));
router.use("/applications", require("./applications"));

module.exports = router;

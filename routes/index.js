// routes/index.js
// central router - collects every sub-router in one place.
// app.js only needs to know about this one file, not each individual route file.
const express = require("express");
const router = express.Router();

router.use("/auth", require("./auth"));
router.use("/users", require("./users"));
router.use("/documents", require("./documents"));
router.use("/templates", require("./templates"));
router.use("/ai", require("./ai"));
router.use("/applications", require("./applications"));

module.exports = router;

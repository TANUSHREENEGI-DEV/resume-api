// routes/users.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const mockAuth = require("../middleware/mockAuth");

router.use(mockAuth);

router.get("/me", controller.getMe);
router.put("/me", controller.updateMe);
router.delete("/me", controller.deleteMe);

module.exports = router;

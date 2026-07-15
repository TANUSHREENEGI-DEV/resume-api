// routes/auth.js
const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/logout", controller.logout);
router.post("/forgot-password", controller.forgotPassword);
router.post("/reset-password", controller.resetPassword);

module.exports = router;

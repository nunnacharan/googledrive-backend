const express = require("express");
const router = express.Router();

const {
  register,
  login,
  activate,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);

router.get("/activate/:token", activate);

router.post("/forgot", forgotPassword);
router.post("/reset/:token", resetPassword);

module.exports = router;

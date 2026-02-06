const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { compressFile } = require("../controllers/compressController");

router.post("/:id", auth, compressFile);

module.exports = router;

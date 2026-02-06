const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const { pdfToWord } = require("../controllers/conversionController");

router.post("/pdf-to-word/:id", auth, pdfToWord);

module.exports = router;

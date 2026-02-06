const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  uploadMiddleware,
  uploadFile,
  createFolder,
  getFiles,
  deleteFile,
  renameFile,
  getFolders,
  shareFile,
  publicDownload,
  getFileUrl            // ✅ ADD THIS
} = require("../controllers/fileController");

/* ===== PUBLIC ROUTE (NO AUTH) ===== */
router.get("/public/:token", publicDownload);

/* ===== PROTECTED ROUTES ===== */
router.get("/", auth, getFiles);
router.get("/folders", auth, getFolders);
router.get("/open/:id", auth, getFileUrl);   // ✅ ADD THIS
router.post("/upload", auth, uploadMiddleware.single("file"), uploadFile);
router.post("/folder", auth, createFolder);
router.post("/share/:id", auth, shareFile);
router.delete("/:id", auth, deleteFile);
router.put("/:id", auth, renameFile);

module.exports = router;

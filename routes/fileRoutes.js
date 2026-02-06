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
  getFileUrl,
  shareFile,
  publicDownload
} = require("../controllers/fileController");


router.get("/", auth, getFiles);
router.get("/folders", auth, getFolders);

router.post("/upload", auth, uploadMiddleware.single("file"), uploadFile);
router.post("/folder", auth, createFolder);

router.delete("/:id", auth, deleteFile);
router.put("/:id", auth, renameFile);
router.post("/share/:id", auth, shareFile);
router.get("/public/:token", publicDownload);


module.exports = router;

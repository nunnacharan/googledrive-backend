const multer = require("multer");
const { v4: uuid } = require("uuid");
const s3 = require("../config/s3"); // ✅ SINGLE S3 INSTANCE
const File = require("../models/File");

/* ================= MULTER ================= */
exports.uploadMiddleware = multer({
  storage: multer.memoryStorage(),
});

/* ================= GET FILE SIGNED URL ================= */
exports.getFileUrl = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || !file.key) {
      return res.status(404).json({ msg: "File not found" });
    }

    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: process.env.AWS_BUCKET,
      Key: file.key,
      Expires: 60, // 1 minute

      // 👇 Forces browser preview
      ResponseContentDisposition: `inline; filename="${file.name}"`,
      ResponseContentType: file.type,
    });

    res.json({ url: signedUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Unable to generate file URL" });
  }
};

/* ================= GET FILES ================= */
exports.getFiles = async (req, res) => {
  const parent = req.query.parent || null;

  const files = await File.find({
    userId: req.user.id,
    parentId: parent,
  });

  res.json(files);
};

/* ================= GET FOLDERS ================= */
exports.getFolders = async (req, res) => {
  const folders = await File.find({
    userId: req.user.id,
    isFolder: true,
  });

  res.json(folders);
};

/* ================= CREATE FOLDER ================= */
exports.createFolder = async (req, res) => {
  const folder = await File.create({
    name: req.body.name,
    isFolder: true,
    parentId: req.body.parentId || null,
    userId: req.user.id,
  });

  res.json(folder);
};

/* ================= UPLOAD FILE (🔥 FIXED HERE) ================= */
exports.uploadFile = async (req, res) => {
  const file = req.file;
  const key = uuid() + "-" + file.originalname;

  await s3.upload({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: file.buffer,

    // ✅ REQUIRED FOR PDF / IMAGE PREVIEW
    ContentType: file.mimetype,
    ContentDisposition: "inline",
    CacheControl: "max-age=31536000",
  }).promise();

  const newFile = await File.create({
    name: file.originalname,
    key,
    size: file.size,
    type: file.mimetype,
    parentId: req.body.parentId || null,
    userId: req.user.id,
  });

  res.json(newFile);
};

/* ================= DELETE ================= */
exports.deleteFile = async (req, res) => {
  const file = await File.findById(req.params.id);

  if (file?.key) {
    await s3.deleteObject({
      Bucket: process.env.AWS_BUCKET,
      Key: file.key,
    }).promise();
  }

  await File.findByIdAndDelete(req.params.id);

  res.json({ msg: "Deleted" });
};

/* ================= RENAME ================= */
exports.renameFile = async (req, res) => {
  await File.findByIdAndUpdate(req.params.id, {
    name: req.body.name,
  });

  res.json({ msg: "Renamed" });
};

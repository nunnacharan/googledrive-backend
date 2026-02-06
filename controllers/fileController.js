const multer = require("multer");
const { v4: uuid } = require("uuid");
const s3 = require("../config/s3");
const File = require("../models/File");
const crypto = require("crypto");

/* ================= MULTER ================= */

exports.uploadMiddleware = multer({
  storage: multer.memoryStorage(),
});


/* ================= GET FILES ================= */

exports.getFiles = async (req, res) => {

  const parent = req.query.parent || null;

  const files = await File.find({
    userId: req.user.id,
    parentId: parent
  });

  res.json(files);
};


/* ================= GET FOLDERS ================= */

exports.getFolders = async (req, res) => {

  const folders = await File.find({
    userId: req.user.id,
    isFolder: true
  });

  res.json(folders);
};


/* ================= CREATE FOLDER ================= */

exports.createFolder = async (req, res) => {

  const folder = await File.create({
    name: req.body.name,
    isFolder: true,
    parentId: req.body.parentId || null,
    userId: req.user.id
  });

  res.json(folder);
};


/* ================= UPLOAD FILE ================= */

exports.uploadFile = async (req, res) => {

  const file = req.file;

  const key = uuid() + "-" + file.originalname;

  await s3.upload({
    Bucket: process.env.AWS_BUCKET,
    Key: key,
    Body: file.buffer,
  }).promise();

  const newFile = await File.create({
    name: file.originalname,
    key,
    size: file.size,
    type: file.mimetype,
    parentId: req.body.parentId || null,
    userId: req.user.id
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
    name: req.body.name
  });

  res.json({ msg: "Renamed" });
};
/* =========================
   SHARE FILE (GENERATE LINK)
========================= */
exports.shareFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.isFolder)
      return res.status(404).json({ msg: "File not found" });

    const token = crypto.randomBytes(16).toString("hex");

    file.shareToken = token;
    file.isShared = true;
    await file.save();

    res.json({
      shareLink: `${process.env.FRONTEND_URL}/share/${token}`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Unable to share file" });
  }
};


/* =========================
   PUBLIC DOWNLOAD (NO AUTH)
========================= */
exports.publicDownload = async (req, res) => {
  try {
    const file = await File.findOne({ shareToken: req.params.token });

    if (!file)
      return res.status(404).send("Invalid or expired link");

    const signedUrl = s3.getSignedUrl("getObject", {
      Bucket: process.env.AWS_BUCKET,
      Key: file.key,
      Expires: 60,
      ResponseContentDisposition: `inline; filename="${file.name}"`,
      ResponseContentType: file.type,
    });

    res.redirect(signedUrl);

  } catch (err) {
    res.status(500).send("Unable to open file");
  }
};

const archiver = require("archiver");
const axios = require("axios");
const { PassThrough } = require("stream");
const s3 = require("../config/s3");
const File = require("../models/File");
const { v4: uuid } = require("uuid");

exports.compressFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || file.isFolder)
      return res.status(404).json({ msg: "File not found" });

    // Download original file from S3
    const response = await axios.get(
      s3.getSignedUrl("getObject", {
        Bucket: process.env.AWS_BUCKET,
        Key: file.key,
        Expires: 60
      }),
      { responseType: "stream" }
    );

    // Create ZIP stream
    const archive = archiver("zip", { zlib: { level: 9 } });
    const zipStream = new PassThrough();

    archive.append(response.data, { name: file.name });
    archive.finalize();

    archive.pipe(zipStream);

    // Upload ZIP to S3
    const zipKey = `${uuid()}-${file.name}.zip`;

    await s3.upload({
      Bucket: process.env.AWS_BUCKET,
      Key: zipKey,
      Body: zipStream,
      ContentType: "application/zip"
    }).promise();

    // Save ZIP file metadata
    const zipFile = await File.create({
      name: `${file.name}.zip`,
      key: zipKey,
      size: file.size,
      type: "application/zip",
      userId: file.userId
    });

    res.json(zipFile);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Compression failed" });
  }
};

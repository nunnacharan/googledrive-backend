const CloudConvert = require("cloudconvert");
const axios = require("axios");
const { v4: uuid } = require("uuid");
const s3 = require("../config/s3");
const File = require("../models/File");

const cloudConvert = new CloudConvert(process.env.CLOUDCONVERT_API_KEY);

exports.pdfToWord = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      return res.status(400).json({ msg: "Only PDF files allowed" });
    }

    // 1️⃣ Create CloudConvert job
    const job = await cloudConvert.jobs.create({
      tasks: {
        importFile: {
          operation: "import/url",
          url: s3.getSignedUrl("getObject", {
            Bucket: process.env.AWS_BUCKET,
            Key: file.key,
            Expires: 300
          })
        },
        convertFile: {
          operation: "convert",
          input: "importFile",
          input_format: "pdf",
          output_format: "docx"
        },
        exportFile: {
          operation: "export/url",
          input: "convertFile"
        }
      }
    });

    // 2️⃣ WAIT for job to finish (THIS WAS MISSING)
    const completedJob = await cloudConvert.jobs.wait(job.id);

    // 3️⃣ Get export task safely
    const exportTask = completedJob.tasks.find(
      task => task.operation === "export/url"
    );

    if (!exportTask || !exportTask.result || !exportTask.result.files) {
      return res.status(500).json({ msg: "Conversion failed at export step" });
    }

    const docxUrl = exportTask.result.files[0].url;

    // 4️⃣ Download converted Word file
    const response = await axios.get(docxUrl, {
      responseType: "arraybuffer"
    });

    const key = `${uuid()}-${file.name.replace(/\.pdf$/i, ".docx")}`;

    // 5️⃣ Upload DOCX to S3
    await s3.upload({
      Bucket: process.env.AWS_BUCKET,
      Key: key,
      Body: response.data,
      ContentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }).promise();

    // 6️⃣ Save DOCX metadata to DB
    const newFile = await File.create({
      name: file.name.replace(/\.pdf$/i, ".docx"),
      key,
      size: response.data.length,
      type:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      userId: file.userId
    });

    res.json(newFile);

  } catch (err) {
    console.error("PDF → Word error:", err);
    res.status(500).json({ msg: "PDF to Word conversion failed" });
  }
};

const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({

  name: String,
  key: String,
  size: Number,
  type: String,

  isFolder: {
    type: Boolean,
    default: false
  },

  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "File",
    default: null
  },

  userId: String

}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);

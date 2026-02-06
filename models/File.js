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

  userId: String,

  /* ===== SHARE FEATURE ===== */
  shareToken: String,
  isShared: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("File", fileSchema);

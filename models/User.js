const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({

  name: String,

  email: {
    type: String,
    unique: true
  },

  password: String,

  isActive: {
    type: Boolean,
    default: false
  },

  resetToken: String,

  activationToken: String

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);

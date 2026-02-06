const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const sendEmail = require("../utils/sendEmail");


/* =================================================
   REGISTER + SEND ACTIVATION EMAIL
================================================= */

exports.register = async (req, res) => {

  try {

    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ msg: "All fields required" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ msg: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const activationToken = crypto.randomBytes(32).toString("hex");

    await User.create({
      name,
      email,
      password: hashed,
      activationToken,
      isActive: false   // ⭐ important
    });
   const link = `${process.env.FRONTEND_URL}/activate/${activationToken}`;

   

    await sendEmail(
  email,
  "Activate your account",
  `
    <h2>Welcome to Cloud Drive</h2>
    <p>Please click below to activate your account:</p>
    <a 
      href="${link}" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      Activate Account
    </a>
  `
);


    res.json({ msg: "Activation email sent" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ msg: "Registration failed" });
  }
};



/* =================================================
   ACTIVATE ACCOUNT
================================================= */

exports.activate = async (req, res) => {

  const token = req.params.token.replace(/"/g, "").trim();

  const user = await User.findOne({
    activationToken: token
  });

  if (!user)
    return res.status(400).json({ msg: "Invalid link" });

  user.isActive = true;
  user.activationToken = null;
  await user.save();

  res.send("✅ Account activated. You can login now.");
};




/* =================================================
   LOGIN
================================================= */

exports.login = async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(400).json({ msg: "Invalid credentials" });

  if (!user.isActive)
    return res.status(400).json({ msg: "Please activate your account" });

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json({ token });
};



/* =================================================
   FORGOT PASSWORD (EMAIL RESET LINK)
================================================= */

exports.forgotPassword = async (req, res) => {

  const user = await User.findOne({ email: req.body.email });

  if (!user)
    return res.status(400).json({ msg: "User not found" });

  const resetToken = crypto.randomBytes(32).toString("hex");

  user.resetToken = resetToken;
  await user.save();

 const link = `${process.env.FRONTEND_URL}/reset/${resetToken}`;

 await sendEmail(
  user.email,
  "Reset Password",
  `
    <h3>Reset your password</h3>
    <p>This link is valid for a limited time.</p>
    <a 
      href="${link}" 
      target="_blank" 
      rel="noopener noreferrer"
    >
      Click here to reset
    </a>
  `
);


  res.json({ msg: "Reset email sent" });
};



/* =================================================
   RESET PASSWORD
================================================= */

exports.resetPassword = async (req, res) => {

  const token = req.params.token.replace(/"/g, "").trim();

  const user = await User.findOne({
    resetToken: token
  });

  if (!user)
    return res.status(400).json({ msg: "Invalid or expired token" });

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetToken = null;

  await user.save();

  res.json({ msg: "Password updated successfully" });
};

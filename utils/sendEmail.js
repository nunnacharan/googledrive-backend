const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendMail = async (to, subject, text) => {
  try {
    await sgMail.send({
      to,
      from: "charannagalakshminarayanagoogl@gmail.com", // must be verified in SendGrid
      subject,
      text,
    });

    console.log("✅ Email sent");
  } catch (err) {
    console.error("❌ Email failed:", err.message);
  }
};

module.exports = sendMail;

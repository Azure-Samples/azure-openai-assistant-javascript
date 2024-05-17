require("dotenv/config");
const nodemailer = require("nodemailer");

const {
  EMAIL_SENDER_NAME,
  EMAIL_SENDER_USERNAME,
  EMAIL_SENDER_APP_PASSWORD
} = process.env;

const transporter = nodemailer.createTransport({
  host: "smtp.office365.com",
  secure: false,
  port: 587,
  auth: {
    user: EMAIL_SENDER_USERNAME,
    pass: EMAIL_SENDER_APP_PASSWORD
  },
  tls: {
    ciphers: "SSLv3",
    rejectUnauthorized: false,
  }
});

exports.sendEmail = async function ({ to, subject, html }) {
  const info = await transporter.sendMail({
    from: `"${EMAIL_SENDER_NAME}" <${EMAIL_SENDER_USERNAME}>`,
    to,
    subject,
    html,
  });

  return info;
}
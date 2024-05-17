require("dotenv/config");
const {
  EMAIL_RECEIVER,
} = process.env;

const mailer = require("./mailer");

exports.getStockPrice = async function getStockPrice(symbol) {
  return Promise.resolve("" + Math.random(10) * 1000); // simulate network request
}

exports.writeAndSendEmail = async function writeAndSendEmail(subject, text, html) {
  const info = await mailer.sendEmail({
    to: EMAIL_RECEIVER, subject, text, html
  });

  return info.messageId;
}
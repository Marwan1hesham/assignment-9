import nodemailer from "nodemailer";
import { EMAIL, PASS } from "../../../../config/config.service.js";

export const sendEmail = async ({
  to,
  subject = "",
  html = "",
  attachments = [],
}) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL,
      pass: PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `Saraha App <${EMAIL}>`,
    to,
    subject,
    html,
    attachments,
  });
  console.log("Message send", info.messageId);
  return info.accepted.length ? true : false;
};

export const generateOtp = async () => {
  return Math.floor(Math.random() * 900000 + 100000);
};

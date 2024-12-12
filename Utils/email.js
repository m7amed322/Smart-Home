const { text } = require("express");
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const sendEmail = async (option, templatePath) => {
  const transporter = nodemailer.createTransport({
    host: process.env.Email_Host,
    port: process.env.Email_Port,
    auth: {
      user: process.env.Email_User,
      pass: process.env.Email_Password,
    },
  });
  //handling files
  let htmlContent = fs.readFileSync(templatePath, "utf-8");
  let template = handlebars.compile(htmlContent);
  let replacements = {
    userName: option.userName,
    userEmail: option.userEmail,
    userPassword: option.userPassword,
    resetUrl: option.resetUrl,
  };
  let replacedHtml = template(replacements);

  const emailOptions = {
    from: "Smart Home support<support@smartHome.com>",
    to: option.email,
    subject: option.subject,
    text: option.message,
    html: replacedHtml,
  };
  await transporter.sendMail(emailOptions);
};
module.exports = sendEmail;

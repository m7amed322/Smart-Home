const {Resend} = require ("resend");
const { text } = require("express");
const handlebars = require("handlebars");
const fs = require("fs");
const resend= new Resend(process.env.Resend_API_Key)
  const sendEmail=async(option,templatePath)=>{
    let htmlContent = fs.readFileSync(templatePath, "utf-8");
    let template = handlebars.compile(htmlContent);
    let replacements = {
      userName: option.userName,
      userEmail: option.userEmail,
      userPassword: option.userPassword,
      resetUrl: option.resetUrl,
    };
    let replacedHtml = template(replacements);
    await resend.emails.send({
        from: "Smart Home <onboarding@resend.dev>",
        to: ['mohamedabdalslam678@gmail.com','ahmedomar3278@gmail.com','delivered@resend.dev'],
        subject: option.subject,
        html: replacedHtml,
})}

module.exports = sendEmail;

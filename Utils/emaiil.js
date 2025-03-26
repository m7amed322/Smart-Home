const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const handlebars = require("handlebars")
const fs = require("fs");
const oauth2Client = new google.auth.OAuth2(
  process.env.clientID,          
  process.env.clientSecret,      
  'https://developers.google.com/oauthplayground' 
);
oauth2Client.setCredentials({
  refresh_token: process.env.refresh_token 
});

async function createTransporter() {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    if (!accessToken.token) throw new Error('Failed to obtain access token');

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Gmail SMTP service
      auth: {
        type: 'OAuth2',       // Authentication method
        user: process.env.Email_User, // Sender’s Gmail address
        clientId: process.env.clientID,
        clientSecret: process.env.clientSecret,
        refreshToken: process.env.refresh_token,
        accessToken: accessToken.token, 
      },
    });
    return transporter;
  } catch (error) {
    throw new Error(`Transporter creation failed: ${error.message}`);
  }
}

 


  
// Exported function to send emails
//option => {email,subject,text}
async function sendEmail(option,templatePath) {
  
  try {
    const transporter = await createTransporter();
    //  handling files
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
      to:option.email,
      subject:option.subject,
      text:option.text,
      html: replacedHtml,
    };
    await transporter.sendMail(emailOptions);
  } catch (error) {
    throw new Error(`Email sending failed: ${error.message}`);
  }
}


module.exports = sendEmail;

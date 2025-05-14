const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const handlebars = require("handlebars")
const fs = require("fs");
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,          
  process.env.CLIENT_SECRET,      
  'https://developers.google.com/oauthplayground' 
);
oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN
});

async function createTransporter() {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    if (!accessToken.token) throw new Error('Failed to obtain access token');

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token, 
      },
    });
    return transporter;
  } catch (error) {
    throw new Error(`Transporter creation failed: ${error.message}`);
  }
}

 


  
//option => {to,subject,text}
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
    fullName:option.fullName,
    resetUrl: option.resetUrl,
    reply:option.reply
  };
  let replacedHtml = template(replacements);

    const emailOptions = {
      from: "Smart Home support<support@smartHome.com>",
      to:option.to,
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
/////////////////////////////////////////////////////////
// const nodemailer = require('nodemailer');
// const { google } = require('googleapis');
// const handlebars = require("handlebars")
// const fs = require("fs");
// const oauth2Client = new google.auth.OAuth2(
//   process.env.clientID,          
//   process.env.clientSecret,      
//   'https://developers.google.com/oauthplayground' 
// );
// oauth2Client.setCredentials({
//   refresh_token: process.env.refresh_token 
// });

// async function createTransporter() {
//   try {
//     const accessToken = await oauth2Client.getAccessToken();
//     if (!accessToken.token) throw new Error('Failed to obtain access token');

//     const transporter = nodemailer.createTransport({
//       service: 'gmail',
//       auth: {
//         type: 'OAuth2',
//         user: process.env.Email_User,
//         clientId: process.env.clientID,
//         clientSecret: process.env.clientSecret,
//         refreshToken: process.env.refresh_token,
//         accessToken: accessToken.token, 
//       },
//     });
//     return transporter;
//   } catch (error) {
//     throw new Error(`Transporter creation failed: ${error.message}`);
//   }
// }

 


  
// //option => {to,subject,text}
// async function sendEmail(option,templatePath) {
  
//   try {
//     const transporter = await createTransporter();
//     //  handling files
//   let htmlContent = fs.readFileSync(templatePath, "utf-8");
//   let template = handlebars.compile(htmlContent);
//   let replacements = {
//     userName: option.userName,
//     userEmail: option.userEmail,
//     userPassword: option.userPassword,
//     resetUrl: option.resetUrl,
//     reply:option.reply
//   };
//   let replacedHtml = template(replacements);

//     const emailOptions = {
//       from: "Smart Home support<support@smartHome.com>",
//       to:option.to,
//       subject:option.subject,
//       text:option.text,
//       html: replacedHtml,
//     };
//     await transporter.sendMail(emailOptions);
//   } catch (error) {
//     throw new Error(`Email sending failed: ${error.message}`);
//   }
// }


// module.exports = sendEmail;
///////////////////////////////////////////////////////////
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const handlebars = require('handlebars');
const fs = require('fs');
const winston = require("winston");
// require('dotenv').config(); // Load environment variables from .env

// Initialize OAuth2 client with consistent variable names
const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,          // Client ID from Google Cloud Console
  process.env.CLIENT_SECRET,      // Client Secret from Google Cloud Console
  'https://developers.google.com/oauthplayground' // Redirect URI
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN // Refresh token from OAuth Playground
});

// Function to create a Nodemailer transporter
async function createTransporter() {
  try {
    const accessToken = await oauth2Client.getAccessToken();
    if (!accessToken.token) {
      throw new Error('No access token returned from Google OAuth');
    }
    winston.info('Access token obtained:', accessToken.token); // Debug log

    const transporter = nodemailer.createTransport({
      service: 'gmail', // Gmail SMTP service
      auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER, // Gmail address from .env
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
        accessToken: accessToken.token, // Short-lived token
      },
    });
    return transporter;
  } catch (error) {
    winston.error('Transporter creation error:', error.response?.data || error.message);
    throw new Error(`Transporter creation failed: ${error.message}`);
  }
}

// Send email with templating
// option: { to, subject, text, userName, userEmail, userPassword, resetUrl, reply }
// templatePath: Path to Handlebars template file
async function sendEmail(option, templatePath) {
  try {
    // Validate required fields
    if (!option.to || !option.subject || !templatePath) {
      throw new Error('Missing required fields: to, subject, or templatePath');
    }

    const transporter = await createTransporter();

    // Read and compile the Handlebars template
    const htmlContent = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(htmlContent);
    const replacements = {
      userName: option.userName || 'User', // Default if not provided
      userEmail: option.userEmail || '',
      userPassword: option.userPassword || '',
      resetUrl: option.resetUrl || '',
      reply: option.reply || ''
    };
    const html = template(replacements);

    // Email options
    const emailOptions = {
      from: 'Smart Home support <support@smartHome.com>', // Sender display name
      to: option.to,           // Recipient
      subject: option.subject, // Subject line
      text: option.text || 'Please view this email in an HTML-compatible client', // Fallback text
      html,                   // Rendered HTML content
    };

    const result = await transporter.sendMail(emailOptions);
    winston.info(`Email sent to ${option.to}: ${result.response}`);
    return { success: true, response: result.response };
  } catch (error) {
    winston.error('Send email error:', error.message);
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

module.exports = sendEmail;
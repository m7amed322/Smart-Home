const nodemailer = require('nodemailer');
const sendEmail = async (option)=>{
    const transporter = nodemailer.createTransport({
        host: process.env.Email_Host,
        port:process.env.Email_Port,
        auth:{
            user:process.env.Email_User,
            pass:process.env.Email_Password
        }
    })
    const emailOptions={
        from:'Smart Home support<support@smartHome.com>',
        to:option.email,
        subject:option.subject,
        text:option.message
    }
    await transporter.sendMail(emailOptions)
}
module.exports = sendEmail;
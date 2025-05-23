const Request = require("../models/request");
const path = require("path");
const sendEmail = require("../Services/emaiil");
const userValidation = require("../validations/user");
module.exports = {
  createRequest: async (req, res, next) => {
    const { error } = userValidation.request(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    let request = await Request.findOne({ email: req.body.email });
    if (request) {
      res.status(400).json("you already sent a request");
      return;
    }
    request = new Request({
      fullName: req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      homeAddress: req.body.homeAddress,
    });
    if (req.file) {
      request.profilePic =
        "https://broken-paulina-smarthomee-b125f114.koyeb.app/api/" +
        req.file.path.replace("uploads\\", "");

    }
    const templatePath = path.join(__dirname, "../Pages/welcomeEmail.html");
    try {
      await sendEmail(
        {
          subject: `Welcome`,
          userName: request.fullName,
          to:request.email
        },
        templatePath
      );
      await request.save();
      res.status(200).json({
        status: "successfully",
        message: " welcome mail sent to the user email",
        request:request
      });
    } catch (err) {
      return next(err);
    }
  },
};

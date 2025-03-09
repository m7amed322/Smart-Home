const { Request, validate } = require("../models/request");
const path = require("path");
const sendEmail = require("../Utils/emaiil");
module.exports = {
  createRequest: async (req, res, next) => {
    const { error } = validate(req.body);
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
        "https://broken-paulina-smarthomee-b125f114.koyeb.app/api/uploads/" +
        req.file.path.replace("uploads\\", "");

    }
    const templatePath = path.join(__dirname, "../Pages/welcomeEmail.html");
    try {
      await sendEmail(
        {
          subject: `Welcome`,
          message: "",
          userName: request.fullName,
        },
        templatePath
      );
      await request.save();
      res.status(200).json({
        status: "successfully",
        message: " welcome mail sent to the user email",
      });
    } catch (err) {
      return next(err);
    }
  },
};

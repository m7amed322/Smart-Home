const { Request, validate } = require("../models/request");
module.exports = {
  createRequest: async (req, res) => {
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
      fullName:req.body.fullName,
      email: req.body.email,
      phoneNumber: req.body.phoneNumber,
      homeAddress: req.body.homeAddress,
    });
    await request.save();
    res.json({message:"request sended"});
  },
};

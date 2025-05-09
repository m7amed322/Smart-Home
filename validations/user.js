const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const userValidation = {
  message: (message) => {
    const schema = joi.object({
      message: joi.string().min(3).max(255).required(),
    });
    return schema.validate(message);
  },
  sequence: (sequence) => {
    const schema = joi.object({
      durationInMin: joi.number().min(1).max(60).required(),
      temp: joi.number().min(2).max(50).required(),
      occuped: joi.string().required(),
      deviceName: joi.string().min(3).max(255).required(),
      roomName: joi.string().min(3).max(255),
    });
    return schema.validate(sequence);
  },
  request: (request) => {
    const schema = joi.object({
      fullName: joi.string().min(3).max(255).required(),
      email: joi.string().email().min(3).max(255).required(),
      phoneNumber: joi.string().min(5).max(15).required(),
      homeAddress: joi.string().min(10).max(255).required(),
    });
    return schema.validate(request);
  },
  update:(userData)=>{
    const schema = joi.object({
      fullName: joi.string().min(3).max(255),
      email: joi.string().email().min(3).max(255),
      currentPass:joi.string().min(3).max(255),
      newPass:joi.string().min(3).max(255)
    });
    return schema.validate(userData);
  }
};
module.exports = userValidation;

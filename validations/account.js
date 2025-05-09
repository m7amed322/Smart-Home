const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const accountValidation = {
  acc: (acc) => {
    const schema = joi.object({
      email: joi.string().email().min(3).max(255).required(),
      password: joi.string().required(),
    });
    return schema.validate(acc);
  },
  email: (email) => {
    const schema = joi.object({
      email: joi.string().email().min(3).max(255).required(),
    });
    return schema.validate(email);
  },


};
module.exports = accountValidation;

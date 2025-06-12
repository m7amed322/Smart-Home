const joi = require("joi");
joi.objectId = require("joi-objectid")(joi);
const adminValidation = {
  request: (request) => {
    const schema = joi.object({
      requestId: joi.objectId().required(),
    });
    return schema.validate(request);
  },
  support: (support) => {
    const schema = joi.object({
      message: joi.string().min(3).max(255).required(),
      supportId: joi.objectId().required(),
    });
    return schema.validate(support);
  },
  home: (home) => {
    const schema = joi.object({
      requestId: joi.objectId().required(),
      ledNumber: joi.array().required(),
      rooms: joi.array().required(),
      devices: joi.array().required(),
      householdSize: joi.number().required(),
    });
    return schema.validate(home);
  },
  update:(adminData)=>{
    const schema = joi.object({
          fullName: joi.string().min(3).max(255),
          email: joi.string().email().min(3).max(255),
        });
        return schema.validate(adminData);
  }
};
module.exports = adminValidation;

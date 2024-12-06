const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const joi = require("joi");
const { Home } = require("../models/home");
const sendEmail = require("../Utils/email");
const crypto = require("crypto");
module.exports = {
  logIn: async (req, res, next) => {
    const { error } = validate(req.body);
    if (error) {
      res.status(400).json(error.details[0].message);
      return;
    }
    let user = await User.findOne({ email: req.body.email });
    if (!user) {
      res.status(400).json({error:"invalid email or password"});
      return;
    }
    const pass = await bcrypt.compare(req.body.password, user.password);
    if (!pass) {
      res.status(400).json({error:"invalid email or password"});
      return;
    }
    const token = user.genToken();
    res.header("x-auth-token", token);
    res.json({message:"logged in successfully"});
  },
  getHome: async (req, res, next) => {
    if (!req.tokenPayload.homeId) {
      res.status(403).json({error:"accsess denied"});
    }
    const home = await Home.findById(req.tokenPayload.homeId);
    res.json(home);
  },
  googleLogIn: async (req, res, next) => {
    if(!req.user){
      res.status(400).json({error:"unauthorized"});
      return;
    }
    let user = new User(req.user);
    const token = user.genToken();
    res
      .status(200)
      .header("x-auth-token", token)
      .json({message:"logged in successfully"});
  },
  forgotPassword: async (req,res,next)=>{
    const {error}=joi.object({email:joi.string().email().min(3).max(255).required()}).validate(req.body)
    if(error){
      res.status(400).json(error.details[0].message);
      return;
    }
    let user = await User.findOne({email:req.body.email});
    if(!user){
      res.status(400).json({error:"invalid email"});
      return;
    }
    resetToken=user.createResetToken();
    await user.save();
    // resetUrl=`${req.protocol}://${req.get('host')}/api/users/reset/${resetToken}`
    resetUrl =`localhost:5173/reset-pass/${resetToken}`
    const message = `we have recieved a password reset request. please use the below link to reset your password
    \n
    ${resetUrl}\n\n this is reset password link will be valid only for 10 mins.
    `;
    try{
    await sendEmail({
      email:user.email,
      subject:`resetting password request`,
      message:message
    });
    res.status(200).json({
      status:"successfully",
      message:"password reset link sent to the user email"
    })
  }catch(err){
    user.passwordResetToken=undefined;
    user.passwordResetTokenExpires=undefined;
    await user.save();
    return next(err)
  }
  },
  resetPassword: async (req,res,next)=>{
    const token = crypto.createHash("sha256").update(req.params.token).digest('hex');
    const user = await User.findOne({passwordResetToken:token , passwordResetTokenExpires:{$gt:Date.now()}});
    if(!user){
      res.status(400).json("not valid token");
      return;
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(req.body.password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires=undefined;
    user.passwordChangeAt=Date.now()
    await user.save();
    const userToken = user.genToken();
    res
      .status(200)
      .header("x-auth-token", userToken)
      .json({message:"logged in successfully"});
  },
};
function validate(user) {
  const schema = joi.object({
    email: joi.string().email().min(3).max(255).required(),
    password: joi.string().required(),
  });
  return schema.validate(user);
}

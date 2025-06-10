const _ = require("lodash");
const { Sequential } = require("../models/sequentials");
const { Device } = require("../models/devices");
const { Prediction } = require("../models/predictions");
const AlertService = require("./alert");
const { User } = require("../models/user");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const Home = require("../models/home");
const { wrapper } = require("../utils/helper");
const path = require("path");
const sendEmail = require("./emaiil");
const Support = require("../models/support");
const { Room } = require("../models/rooms");
const Request = require("../models/request");
const userService = {
  logIn: wrapper(async (email, password) => {
    let user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("invalid email or password");
    }
    const pass = await bcrypt.compare(password, user.password);
    if (!pass) {
      throw new Error("invalid email or password");
    }
    const token = user.genToken();
    user.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await user.save();
    return { user, token };
  }),
  getHome: wrapper(async (isAdmin, homeId) => {
    if (isAdmin) {
      throw new Error("access denied");
    }
    return await Home.findById(homeId);
  }),
  getMe: wrapper(async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("access denied");
    }
    return user;
  }),
  googleLogIn: wrapper(async (verifiedUser) => {
    if (!verifiedUser) {
      throw new Error("unauthorized");
    }
    let user = await User.findOne({ _id: verifiedUser._id });
    const token = user.genToken();
    user.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await user.save();
    return { user, token };
  }),
  firstTimePassword: wrapper(async (userId, password) => {
    let user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("access denied"); // because to use this endpoint u must be authenticated so u are admin or user
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordChangeAt = Date.now();
    user.isActive = true;
    await user.save();
    return password;
  }),
  forgotPassword: wrapper(async (email) => {
    let user = await User.findOne({ email: email });
    if (!user) {
      throw new Error("invalid email");
    }
    if (!user.isActive) {
      throw new Error("check your email inbox");
    }
    resetToken = user.createResetToken();
    await user.save();
    const resetUrl = `http://localhost:5173/reset-pass/${resetToken}`;
    try {
      const templatePath = path.join(__dirname, "../Pages//resetPassword.html");
      await sendEmail(
        {
          subject: `resetting password request`,
          resetUrl: resetUrl,
          to: email,
        },
        templatePath
      );
      return resetUrl;
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      await user.save();
      throw err;
    }
  }),
  resetPassword: wrapper(async (resetToken, password) => {
    const token = crypto.createHash("sha256").update(resetToken).digest("hex");
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });
    if (!user) {
      throw new Error("not valid token");
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangeAt = new Date();
    await user.save();
    return password;
  }),
  support: wrapper(async (message, userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("access denied");
    }
    if (await Support.findOne({ "user._id": user._id, responsed: false })) {
      throw new Error(
        "you already sent a support before wait for its responding then you can send a new one"
      );
    }
    const support = new Support({
      user: user,
      message: message,
    });
    await support.save();
    return { user, support };
  }),
  logout: wrapper(async (userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("access denied");
    }
    user.jwt = undefined;
    user.jwtExpires = undefined;
    await user.save();
    return user.email;
  }),
  updateMe: wrapper(
    async (userId, fullName, email, phoneNumber, userProfilePic) => {
      let user = await User.findOne({ _id: userId });
      const oldEmail = user.email;
      if (!user) {
        throw new Error("user not found");
      }
      if (userProfilePic) {
        user.userProfilePic =
          "https://broken-paulina-smarthomee-b125f114.koyeb.app/api/" +
          userProfilePic.path.replace("uploads\\", "");
      }
      await Promise.all([
        User.updateOne(
          { _id: userId },
          {
            $set: {
              fullName: fullName || user.fullName,
              email: email || user.email,
              phoneNumber: phoneNumber || user.phoneNumber,
            },
          }
        ),
        Home.updateOne(
          { userEmail: oldEmail },
          {
            $set: {
              userEmail: email || user.email,
              userFullName: fullName || user.fullName,
            },
          }
        ),
        user.save(),
      ]);
      user = await User.findOne({ _id: userId });
      const request = await Request.findOne({ email: oldEmail });
      const support = await Support.findOne({ "user._id": userId });
      request.fullName = user.fullName;
      request.email = user.email;
      request.profilePic = user.userProfilePic;
      if (support) {
        support.user = user;
        await support.save();
      }
      await request.save();
      return user;
    }
  ),
  changePassword: async (newPass, currentPass, userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("user not found");
    }
    if (newPass) {
      if (!currentPass) {
        throw new Error("current password is required");
      }
      const pass = await bcrypt.compare(currentPass, user.password);
      if (!pass) {
        throw new Error("invalid password");
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPass, salt);
      user.passwordChangeAt = new Date();
      user.isActive = true;
      await user.save();
    }
    return user;
  },
};
module.exports = userService;

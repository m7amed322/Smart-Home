const _ = require("lodash");
const { Sequential } = require("../models/sequentials");
const { Device } = require("../models/devices");
const { Prediction } = require("../models/predictions");
const AlertService = require("./alert");
const { Admin } = require("../models/admin");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { Home } = require("../models/home");
const { wrapper } = require("../utils/helper");
const path = require("path");
const sendEmail = require("./emaiil");
const { Support } = require("../models/support");
const { Request } = require("../models/request");
const adminService = {
  logIn: wrapper(async (email, password) => {
    let admin = await Admin.findOne({ email: email });
    if (!admin) {
      throw new Error("invalid email or password");
    }
    const pass = await bcrypt.compare(password, admin.password);
    if (!pass) {
      throw new Error("invalid email or password");
    }
    const token = admin.genToken();
    admin.jwt = crypto.createHash("sha256").update(token).digest("hex");
    await admin.save();
    return { admin, token };
  }),
  logout: wrapper(async (adminId) => {
    const admin = await Admin.findOne({ _id: adminId });
    if (!admin) {
      throw new Error("access denied");
    }
    admin.jwt = undefined;
    admin.jwtExpires = undefined;
    await admin.save();
    return admin.email;
  }),
  forgotPassword: wrapper(async (email) => {
    let admin = await Admin.findOne({ email: email });
    if (!admin) {
      throw new Error("invalid email");
    }
    resetToken = admin.createResetToken();
    await admin.save();
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
      admin.passwordResetToken = undefined;
      admin.passwordResetTokenExpires = undefined;
      await admin.save();
      throw err;
    }
  }),
  resetPassword: wrapper(async (resetToken, password) => {
    const token = crypto.createHash("sha256").update(resetToken).digest("hex");
    const admin = await Admin.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });
    if (!admin) {
      throw new Error("not valid token");
    }
    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(password, salt);
    admin.passwordResetToken = undefined;
    admin.passwordResetTokenExpires = undefined;
    admin.passwordChangeAt = Date.now();
    await admin.save();
    return password;
  }),
};
module.exports = adminService;

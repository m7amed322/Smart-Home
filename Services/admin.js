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
const { getRequestById } = require("../controllers/admins");
const { Room } = require("../models/rooms");
const { User } = require("../models/user");
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
  getRequest: wrapper(async () => {
    const requests = await Request.find({});
    if (requests.length === 0) {
      throw new Error("no requests found");
    }
    return requests;
  }),
  getRequestById: wrapper(async (requestId) => {
    const request = await Request.findOne({ _id: requestId });
    if (!request) {
      throw new Error("not found");
    }
    return request;
  }),
  getMe: wrapper(async (adminId) => {
    const admin = await Admin.findOne({ _id: adminId });
    return admin;
  }),
  async createHome(req) {
    const request = await Request.findOne({ _id: req.requestId });
    if (!request) {
      throw new Error("Requset not found");
    }
    const home = new Home({
      address: request.homeAddress,
      userFullName: request.fullName,
      userEmail: request.email,
      householdSize: req.householdSize,
    });
    await home.save();

    for (let index = 0; index < req.devices.length; index++) {
      await this.createDevice(req.devices[index], home._id);
    }

    const roomPromises = req.rooms.map(async (roomName, index) => {
      return this.createRoom(roomName, home._id, req.ledNumber[index]);
    });
    await Promise.all(roomPromises);
    request.homeCreated=true;
    await request.save()
    return home;
  },
  async createDevice(Name, homeId) {
    if (!Name || !homeId) {
      throw new Error("Device name and homeId are required");
    }
    try {
      const sameNameDevices = await Device.find({
        name: new RegExp(`^${Name}.?$`, "i"),
        homeId: homeId,
      });
      let finalName = Name;
      if (sameNameDevices.length == 1) {
        await Device.updateOne(
          { _id: sameNameDevices[0]._id },
          { $set: { name: finalName + 1 } }
        );
        const firstPred = await Prediction.find({
          "device.homeId": homeId,
          "device.name": finalName,
        });
        await Prediction.updateOne(
          { _id: firstPred[0]._id },
          { $set: { "device.name": finalName + 1 } }
        );
        await Home.updateOne(
          { _id: homeId, "devices.name": sameNameDevices[0].name },
          { $set: { "devices.$.name": finalName + 1 } }
        );
        finalName = finalName + 2;
      } else if (sameNameDevices.length > 1) {
        const maxNumber = Math.max(
          ...sameNameDevices.map((device) => {
            const match = device.name.match(/\d+$/);
            return match ? parseInt(match[0]) : "";
          })
        );
        console.log(`the max number is : ${maxNumber}`);
        finalName = `${finalName}${maxNumber + 1}`;
      }
      const device = new Device({
        name: finalName,
        homeId: homeId,
      });
      const pred = new Prediction({
        "device.name": device.name,
        "device.homeId": device.homeId,
        "device.id": device._id,
      });
      await device.save();
      await pred.save();
      await Home.updateOne({ _id: homeId }, { $addToSet: { devices: device } });
      return device;
    } catch (err) {
      throw err;
    }
  },
  async createRoom(name, homeId, ledNumber) {
    if (
      !name ||
      !homeId ||
      !Number.isInteger(ledNumber) ||
      ledNumber < 1 ||
      ledNumber > 3
    ) {
      throw new Error("Invalid room name, homeId, or LED number");
    }
    const led = Array.from({ length: ledNumber }, (_, index) => ({
      name: `Lighting${index + 1}`,
    }));
    const room = new Room({
      name: name.trim(),
      homeId: homeId,
      led,
    });
    try {
      await room.save();
      const predPromises = room.led.map(async (ledItem) => {
        const pred = new Prediction({
          "device.name": ledItem.name,
          "device.homeId": room.homeId,
          "device.id": ledItem._id,
          roomName: room.name,
        });
        ledItem.pred = pred;
        await pred.save();
      });
      await Promise.all(predPromises);
      await Home.updateOne({ _id: homeId }, { $addToSet: { rooms: room } });
      return room;
    } catch (err) {
      throw err;
    }
  },
  createAcc: wrapper(async (requestId) => {
    const request = await Request.findOne({ _id: requestId });
    const home = await Home.findOne({ userEmail:request.email });
    if (!request || !home) {
      throw new Error("request or home not found");
    }
    const user = new User({
      fullName: request.fullName,
      email: request.email,
      password: request.email,
      home: _.pick(home, ["address", "householdSize", "_id"]),
      userProfilePic: request.profilePic,
      phoneNumber: request.phoneNumber,
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);
    try {
      const templatePath = path.join(__dirname, "../Pages/userInfo.html");
      await sendEmail(
        {
          subject: `Credentials`,
          userEmail: user.email,
          userPassword: user.email,
          to: user.email,
        },
        templatePath
      );
      request.accCreated = true;
      await request.save();
      await user.save();
      return user;
    } catch (err) {
      throw err;
    }
  }),
  getHomes: wrapper(async () => {
    const home = await Home.find(
      {},
      {
        "devices.seqs": 0,
        "devices.preds": 0,
        "rooms.led.seqs": 0,
        "rooms.led.preds": 0,
      }
    );
    if (home.length == 0) {
      throw new Error("no home found");
    }
    return home;
  }),
  getSupports: wrapper(async () => {
    const support = await Support.find({});
    if (support.length == 0) {
      throw new Error("no supports found");
    }
    return support;
  }),
  getUsers: wrapper(async () => {
    const user = await User.find({});
    if (user.length == 0) {
      throw new Error("no users found");
    }
    return user;
  }),
  getHomeById: wrapper(async (homeId) => {
    const home = await Home.findOne(
      { _id: homeId },
      {
        "devices.seqs": 0,
        "devices.preds": 0,
        "rooms.led.seqs": 0,
        "rooms.led.preds": 0,
      }
    );
    if (!home) {
      throw new Error("no home found with that ID");
    }
    return home;
  }),
  getUserById: wrapper(async (userId) => {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new Error("no user found with that ID");
    }
    return user;
  }),
  getSupportById: wrapper(async (supportId) => {
    const support = await Support.findOne({ _id: supportId });
    if (!support) {
      throw new Error("no support found with that ID");
    }
    return support;
  }),
  replySupport: async (message, supportId) => {
    try {
      const support = await Support.findOne({ _id: supportId });
      if (!support) {
        throw new Error("no support found with that ID");
      }
      const templatePath = path.join(__dirname, "../Pages/supportEmail.html");
      await sendEmail(
        {
          subject: `replying your support`,
          reply: message,
          to: support.user.email,
        },
        templatePath
      );
      support.responsed = true;
      await support.save();
      return support;
    } catch (err) {
      throw err;
    }
  },
};
module.exports = adminService;

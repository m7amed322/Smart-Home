const _ = require("lodash");
const { Sequential } = require("../models/sequentials");
const { Device } = require("../models/devices");
const { Prediction } = require("../models/predictions");
const AlertService = require("./alert");
const { User } = require("../models/user");
const userService = {
  createSequence: async (homeId, seqData) => {
    try {
      const device = await Device.findOne({
        homeId: homeId,
        name: seqData.deviceName,
      });
      if (!device) {
        throw new Error("device of this home not found ");
      }
      const seq = new Sequential({
        home_id: homeId,
        appliance: seqData.deviceName,
        temperature_setting_C: seqData.temp,
        occupancy_status: seqData.occuped,
        usage_duration_minutes: seqData.durationInMin,
      });
      const seqs = await Sequential.find({
        home_id: homeId,
        appliance: seq.appliance,
      });
      if (seqs.length == 0) {
        seq.number = 1;
      } else if (seqs.length > 0 && seqs.length < 12) {
        seq.number = parseInt(seqs[seqs.length - 1].number) + 1;
      } else {
        const n = seqs[0].number;
        await Sequential.deleteOne({ number: n });
        seq.number = n;
      }
      await seq.save();
      device.seqs = await Sequential.find({
        home_id: homeId,
        appliance: seq.appliance,
      });
      await device.save();
      return { seq, device };
    } catch (err) {
      throw new Error("failed of creating a sequential document", err);
    }
  },
  handlePrediction: async (device, predFun,io=null) => {
    try {
      if (device.seqs.length == 12) {
        const predValue = predFun(
          _.map(device.seqs, (obj) =>
            _.pick(obj, [
              "occupancy_status",
              "temperature_setting_C",
              "usage_duration_minutes",
              "appliance",
              "home_id",
            ])
          )
        );
        const prediction = await Prediction.findOne({ "device.name": device.name,"device.homeId":device.homeId });
        prediction.after_1hour = prediction.after_2hour;
        prediction.after_2hour = prediction.after_3hour;
        prediction.after_3hour = prediction.after_4hour;
        prediction.after_4hour = prediction.after_5hour;
        prediction.after_5hour = prediction.after_6hour;
        prediction.after_6hour = predValue;
        await prediction.save();
        device.preds = prediction;
        await device.save();
        const user = await User.findOne({ "home._id": device.homeId });
        if (prediction.after_6hour > 50) {
          const alert=await AlertService.createAlert(
            user._id,
            `from the device:${device.name} the predicted value after 6 hours:${predValue} `,io
          );
        }
        return prediction;
      }
      return null;
    } catch (err) {
      throw new Error("failed to predict");
    }
  },
};
module.exports = userService;

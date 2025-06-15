 const axios = require("axios");
 const _ = require("lodash");
 const winston = require("winston");
 async function postData(sequence) {
  try {
    const response = await axios.post(
      "http://satisfied-randie-smart-home-energy-consumption-5c3419ef.koyeb.app/predict",
      {
        input_data: sequence,
      }
    );
    return response.data
  } catch (error) {
    return error
  }
}
 const predict= async (sequence) => {
    if (sequence.length == 12) {
      keys = Object.keys(sequence[0]);
      if (
        _.isEqual(keys, [
          "occupancy_status",
          "temperature_setting_C",
          "usage_duration_minutes",
          "appliance",
          "home_id",
        ])
      ) {
        const predicted = await postData(sequence)
        return predicted;
      } else {
        winston.info("error in keys");
      }
    } else {
      winston.info("error in lenght");
    }
};
module.exports = predict;

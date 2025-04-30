//where i will prepare the function that call the model api 
const _ = require("lodash");
function getRandom(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}
 const predict= (sequence) => {
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
        return getRandom(1, 100);
      } else {
        console.log("error in keys");
      }
    } else {
      console.log("error in lenght");
    }
};
module.exports = predict;

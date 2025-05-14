//where i will prepare the function that call the model api 
const _ = require("lodash");
function getRandom(min, max) {
  const random = Math.random() * (max - min) + min;
  return Number(random.toFixed(2));
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
        return getRandom(1, 3);
      } else {
        console.log("error in keys");
      }
    } else {
      console.log("error in lenght");
    }
};
module.exports = predict;

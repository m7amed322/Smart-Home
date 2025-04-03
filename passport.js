// const passport = require("passport");
// const { User } = require("./models/user");
// const googlePlusTokenStrategy = require("passport-google-plus-token");
// passport.use(
//   "googleToken",
//   new googlePlusTokenStrategy(
//     {
//       clientID:
//         process.env.clientID,
//       clientSecret: process.env.clientSecret,
//     },
//     async (accessToken,refreshToken, profile, done) => {
//       try {
//         const user = await User.findOne({ googleId: profile.id });
//         if (user) {
//           //in controller i have req.user with the user that verified his gmail
//           // if it's not match any google id in db it will be unathorized(400)
//           return done(null, user);
//         } else {
//           console.log("it doesn't exist");
//           return done(null, null);
//         }
//       } catch (err) {
//         console.log(err);
//         done(null)
//       }
//     }
//   )
// );

const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

module.exports = function(passport){
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback"
      },
      async (accessToken, refreshToken, profile, cb)=>{
          console.log(profile.emails[0].value.split('@')[0], 'pro')
            const newUser = {
                googleId: profile.id,
                username: profile.emails[0].value.split('@')[0],
                email: profile.emails[0].value,
                profilePicture: profile.photos[0].value,
                password: profile.emails[0].value,
            };

            try{
                let user = await User.findOne({googleId: profile.id});
                if(user){
                    console.log(user, 'user')
                    return cb(null, user);
                }
                else{
                    user = await User.create(newUser);
                    return cb(null, user);
                }
            }
            catch(err){
                console.error(err);
            }
      }
    ));

    passport.serializeUser((user, done)=>{
        done(null, user.id);
    });

    passport.deserializeUser((id, done)=>{
        User.findById(id, (err, user)=>{
          done(err, user);
        });   
    });

}
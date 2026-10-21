const passport = require('passport');
const User = require('../model/User');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
//
const ADMIN_EMAILS = ['tanmayp062@gmail.com'];
//
require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true
},
async(req,accessToken,refreshToken,profile,done) => {
  const {emails,displayName,photos} = profile ;
  try {
     let user = await User.findOne({email:emails[0].value})
    //  if(user){
    //     if(!user.profilePicture){
    //         user.profilePicture = photos[0]?.value;
    //         await user.save();
    //     }
    //     return done(null,user);
    //  }

   if (user) {
    let updated = false;

    // Add profilePicture if missing
    if (!user.profilePicture && photos[0]?.value) {
        user.profilePicture = photos[0]?.value;
        updated = true;
    }

    // Keep ADMIN_EMAILS in sync (also upgrades existing users)
    const shouldBeAdmin = ADMIN_EMAILS.includes(emails[0]?.value);
    if (shouldBeAdmin && user.role !== "admin") {
        user.role = "admin";
        updated = true;
    } else if (!user.role) {
        user.role = shouldBeAdmin ? "admin" : "user";
        updated = true;
    }

    if (updated) {
        await user.save();
    }

    return done(null, user);
}


//
const isAdmin = ADMIN_EMAILS.includes(emails[0]?.value);
//

   //if user not found create new one
   user = await User.create({
       username : displayName,
       email: emails[0]?.value,
       profilePicture: photos[0]?.value,
       //
       role: isAdmin ? 'admin' : 'user',
       //
   })
   done(null,user)

  } catch (error) {
    done(error)
  }

} 

));

module.exports = passport ;
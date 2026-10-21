const express = require('express');
const {validateEmail,
    sendOtp,
    verifyOtp, registerUser, loginUser, logout } = require('../controllers/authController');
const passport = require('passport');
const { generateToken } = require('../utils/generateToken');
const router = express.Router();

//
router.post("/validate-email", validateEmail);
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
//

router.post('/register',registerUser);
router.post('/login',loginUser)
router.get('/logout', logout)


//google oauth routes
router.get('/google',passport.authenticate('google', {
    scope: ['profile', 'email']
}))

//google callback routes
router.get('/google/callback',passport.authenticate('google',{failureRedirect : `${process.env.FRONTEND_URL}/user-login`,session:false}),
(req,res) => {

     const accessToken = generateToken(req?.user);

        res.cookie("auth_token" , accessToken,{
            httpOnly: true,
            sameSite: 'none', // Required for cross-site cookies
            secure: true, // Set to true if using HTTPS
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days (matches JWT expiry)
            path: '/', // Ensure cookie is accessible across the entire site
        })
        res.redirect(`${process.env.FRONTEND_URL}`)
}
)



module.exports = router;


// const express = require('express');
// // const { registerUser, loginUser, logout } = require('../controllers/authController');
// //
// const { registerUser, loginUser, logout , validateEmail, sendOtp, verifyOtp} = require('../controllers/authController');
// //
// const passport = require('passport');
// const { generateToken } = require('../utils/generateToken');
// const router = express.Router();

// //
// router.post("/validate-email", validateEmail);
// router.post("/send-otp", sendOtp);
// router.post("/verify-otp", verifyOtp);
// //

// router.post('/register',registerUser);
// router.post('/login',loginUser)
// router.get('/logout', logout)


// //google oauth routes
// router.get('/google',passport.authenticate('google', {
//     scope: ['profile', 'email']
// }))

// //google callback routes
// router.get('/google/callback',passport.authenticate('google',{failureRedirect : `${process.env.FRONTEND_URL}/user-login`,session:false}),
// (req,res) => {

//      const accessToken = generateToken(req?.user);

//         res.cookie("auth_token" , accessToken,{
//             httpOnly: true,
//         })
//         res.redirect(`${process.env.FRONTEND_URL}`)
// }
// )



// module.exports = router;



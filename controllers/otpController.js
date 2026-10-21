const User = require("../model/User");
const response = require("../utils/responseHandler");
const bcrypt = require("bcryptjs");

// For storing OTPs temporarily
const otpStore = new Map(); // You can replace this with Redis for production

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// 1️⃣ Send OTP
const sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return response(res, 400, "Email is required");

        // check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return response(res, 400, "Email is already registered");

        const otp = generateOTP();
        otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // expires in 5 min

        // Here, instead of actually sending email, we'll log OTP
        console.log(`🔐 OTP for ${email}: ${otp}`);

        return response(res, 200, "OTP sent successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal Server Error", error.message);
    }
};
// 
// 2️⃣ Verify OTP and register
const verifyOTPAndRegister = async (req, res) => {
    try {
        const { username, email, otp, password, gender, dateOfBirth } = req.body;

        const record = otpStore.get(email);
        if (!record) return response(res, 400, "OTP not requested");

        if (Date.now() > record.expiresAt) {
            otpStore.delete(email);
            return response(res, 400, "OTP expired");
        }

        if (record.otp !== otp) return response(res, 400, "Invalid OTP");

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            gender,
            dateOfBirth,
        });

        await newUser.save();
        otpStore.delete(email); // clear OTP after successful registration

        return response(res, 201, "User registered successfully", {
            username: newUser.username,
            email: newUser.email,
        });
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal Server Error", error.message);
    }
};

module.exports = { sendOTP, verifyOTPAndRegister };

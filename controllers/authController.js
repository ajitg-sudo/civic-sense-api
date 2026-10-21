


const User = require("../model/User");
const Otp = require("../model/Otp"); // For OTP temp storage
const { generateToken } = require("../utils/generateToken");
const response = require("../utils/responseHandler");
const bcrypt = require('bcryptjs');
const validator = require("validator");
const dns = require("dns").promises;
const nodemailer = require("nodemailer");


const OTP_EXPIRY_MINUTES = 5;

// Utils
function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: process.env.MAIL_SECURE === 'true', // false for STARTTLS (587), true for SSL (465)
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // helps if BigRock uses a custom certificate
    }
});


// =====================================
// ✅ Validate Email - Syntax & MX
// =====================================
const validateEmail = async (req, res) => {
     console.log('validateEmail called with:', req.body);
    const { email } = req.body;

    if (!validator.isEmail(email)) {
        return response(res, 400, "Invalid email format.");
    }

    const domain = email.split("@")[1];

    try {
        const mxRecords = await dns.resolveMx(domain);
        if (mxRecords && mxRecords.length > 0) {
            return response(res, 200, "Valid email with MX record.");
        } else {
            return response(res, 400, "Email domain does not have MX records.");
        }
    } catch (error) {
        // Handle DNS errors gracefully - network issues shouldn't block registration
        // If DNS resolution fails (timeout, ECONNREFUSED, etc.), still allow the email
        // since the email format is valid and DNS failures can be temporary/network-related
        console.warn('DNS resolution failed for domain:', domain, error.message);
        
        // Return success if email format is valid, even if MX record check fails
        // The actual email validation will happen when we try to send the OTP
        return response(res, 200, "Email format is valid.");
    }
};

// =====================================
// ✅ Send OTP
// =====================================
const sendOtp = async (req, res) => {
    const { email  ,username} = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return response(res, 400, "Email is already registered. Please log in instead.");
        }

        
        // Check if username already exists
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return response(res, 400, "Username is already taken. Please choose a different username.");
        }

        const otp = generateOtp();

        await Otp.findOneAndUpdate(
            { email }, // OTP is only linked to email, not username
            {
                otp,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000)
            },
            { upsert: true, new: true }
        );

        await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: email,
            subject: "Your OTP Code",
            html: `<p>Your OTP code is: <strong>${otp}</strong></p><p>It will expire in ${OTP_EXPIRY_MINUTES} minutes.</p>`
        });

        return response(res, 200, "OTP sent successfully.");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Failed to send OTP.", error.message);
    }
};



const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const record = await Otp.findOne({ email });

        console.log("OTP from body:", otp);
        console.log("OTP from DB:", record?.otp);

        if (!record) {
            return response(res, 400, "OTP not found for this email.");
        }

        if (record.expiresAt < new Date()) {
            await Otp.deleteOne({ email });
            return response(res, 400, "OTP has expired. Please request a new one.");
        }

        if (record.otp.trim() !== otp.toString().trim()) {
            console.log("OTP mismatch:", record.otp, otp);
            return response(res, 400, "Invalid OTP.");
        }

        await Otp.deleteOne({ email });
        return response(res, 200, "OTP verified successfully.");
    } catch (error) {
        console.error("Error in verifyOtp:", error);
        return response(res, 500, "OTP verification failed.", error.message);
    }
};



// =====================================
// ✅ Register User
// =====================================
const registerUser = async (req, res) => {
    try {
        const { username, email, password, gender, dateOfBirth } = req.body;

        // Check if email already exists
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            return response(res, 400, "User with this email already exists");
        }

        // Check if username already exists
        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            return response(res, 400, "Username is already taken. Please choose a different username.");
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            email,
            password: hashedPassword,
            gender,
            dateOfBirth
        });

        await newUser.save();

        const accessToken = generateToken(newUser);

        res.cookie("auth_token", accessToken, {
            httpOnly: true,
            sameSite: 'none', // Required for cross-site cookies
            secure: true,
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days (matches JWT expiry)
            path: '/', // Ensure cookie is accessible across the entire site
        });

        return response(res, 201, "User created successfully", {
            username: newUser.username,
            email: newUser.email
        });

    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal Server Error", error.message);
    }
};

// =====================================
// ✅ Login User
// =====================================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return response(res, 404, "User not found with this email");
        }

           if (!user.password) {
            return response(res, 400, "This email is registered via Google. Please log in using Google.");
        }

        const matchPassword = await bcrypt.compare(password, user.password);
        if (!matchPassword) {
            return response(res, 404, "Invalid Password");
        }

        const accessToken = generateToken(user);

        res.cookie("auth_token", accessToken, {
            httpOnly: true,
            sameSite: 'none', // Required for cross-site cookies
            secure: true,
            maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days (matches JWT expiry)
            path: '/', // Ensure cookie is accessible across the entire site
        });

        return response(res, 201, "User logged in successfully", {
            _id: user._id,
            username: user.username,
            email: user.email,
            profilePicture: user.profilePicture,
            role: user.role,
        });

    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal Server Error", error.message);
    }
};


// =====================================
// ✅ Logout
// =====================================
const logout = (req, res) => {
    try {
        res.cookie("auth_token", "", {
            httpOnly: true,
            sameSite: 'none', // Required for cross-site cookies
            secure: true,
            maxAge: 0, // Immediately expire the cookie
            path: '/', // Match the path used when setting the cookie
        });
        return response(res, 200, "User logged out successfully");
    } catch (error) {
        console.error(error);
        return response(res, 500, "Internal Server Error", error.message);
    }
};

module.exports = {
    validateEmail,
    sendOtp,
    verifyOtp,
    registerUser,
    loginUser,
    logout
};

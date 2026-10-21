// 📂 routes/adminRoute.js
const express = require("express");
const router = express.Router();
const { authMiddleware, verifyAdmin } = require("../middleware/authMiddleware");

const User = require("../model/User");

// Promote a user to admin (existing admins only).
// Bootstrap: if no admin exists yet, any authenticated user can promote an email.
router.post("/make-admin", authMiddleware, async (req, res) => {
  const { email } = req.body;

  try {
    const adminCount = await User.countDocuments({ role: "admin" });
    const requesterIsAdmin = req.user?.role === "admin";

    if (adminCount > 0 && !requesterIsAdmin) {
      return res.status(403).json({ message: "Forbidden: Admins only!" });
    }

    const user = await User.findOneAndUpdate(
      { email },
      { role: "admin" },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json({ message: `${email} is now an admin`, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});


// ✅ Example: Get all users (admin only)
router.get("/users", authMiddleware, verifyAdmin, async (req, res) => {
  try {
    const users = await User.find({},"-password");
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});


// Add more admin-only routes here...

module.exports = router;

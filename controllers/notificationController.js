const Notification = require("../model/Notification");
const response = require("../utils/responseHandler");

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 50);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate("sender", "username profilePicture")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, read: false }),
    ]);

    return response(res, 200, "Notifications fetched", {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    });
  } catch (error) {
    console.error("getNotifications:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const unreadCount = await Notification.countDocuments({
      recipient: userId,
      read: false,
    });
    return response(res, 200, "Unread count fetched", { unreadCount });
  } catch (error) {
    console.error("getUnreadCount:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const markAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { read: true },
      { new: true }
    ).populate("sender", "username profilePicture");

    if (!notification) {
      return response(res, 404, "Notification not found");
    }

    return response(res, 200, "Notification marked as read", notification);
  } catch (error) {
    console.error("markAsRead:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const result = await Notification.updateMany(
      { recipient: userId, read: false },
      { read: true }
    );

    return response(res, 200, "All notifications marked as read", {
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("markAllAsRead:", error);
    return response(res, 500, "Internal server error", error.message);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
};

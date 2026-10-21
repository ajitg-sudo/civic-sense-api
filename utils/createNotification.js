const Notification = require("../model/Notification");

/**
 * Create a notification. Silently no-ops if recipient === sender.
 */
const createNotification = async ({
  recipient,
  sender,
  type,
  message,
  link = "/",
  entityType = "system",
  entityId = null,
}) => {
  try {
    if (!recipient || !sender) return null;
    if (recipient.toString() === sender.toString()) return null;

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      message,
      link,
      entityType,
      entityId,
    });

    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

module.exports = { createNotification };

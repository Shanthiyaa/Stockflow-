const Notification = require('../models/Notification');

// @desc   Get my notifications
// @route  GET /api/notifications
// @access Protected
const getNotifications = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const query = { user: req.user._id };

  const total = await Notification.countDocuments(query);
  const unreadCount = await Notification.countDocuments({ ...query, isRead: false });
  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  res.json({
    success: true,
    data: { notifications, total, unreadCount, page: Number(page), pages: Math.ceil(total / limit) },
  });
};

// @desc   Mark notification as read
// @route  PUT /api/notifications/:id/read
// @access Protected
const markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found.' });
  res.json({ success: true, data: { notification } });
};

// @desc   Mark all notifications as read
// @route  PUT /api/notifications/read-all
// @access Protected
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
};

// @desc   Delete a notification
// @route  DELETE /api/notifications/:id
// @access Protected
const deleteNotification = async (req, res) => {
  await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  res.json({ success: true, message: 'Notification deleted.' });
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };

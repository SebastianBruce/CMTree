const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Notification = require("../models/Notification");

// Ensure the user is authenticated
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error_msg", "Please log in to view that resource");
  res.redirect("/login"); // or res.redirect("/")
}

// Get all notifications for the logged-in user
router.get("/notifications", ensureAuthenticated, async (req, res) => {
  try {

    // Fetch notifications
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .populate("sender", "username profilePicture")
      .populate("assignment", "title description");

    // Render the notifications view, passing the notifications data
    res.render("notifications", { notifications, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /notifications/mark-all-read
router.put("/notifications/mark-all-read", ensureAuthenticated, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { $set: { isRead: true } }
    );

    // Emit an event to the user's room
    const io = req.app.get('io');
    io.to(req.user._id.toString()).emit('notifications-updated');

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


router.get("/notifications/unread-count", ensureAuthenticated, async (req, res) => {
  try {
    const count = await Notification.countDocuments({ recipient: req.user._id, isRead: false });
    res.json({ count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;

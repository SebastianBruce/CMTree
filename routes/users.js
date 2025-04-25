const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const multer = require('multer');
const User = require('../models/User');
const Post = require("../models/Post");
const Notification = require("../models/Notification");

const upload = multer(); // For handling profile picture uploads
const reserved = ['login', 'register', 'posts', 'edit-profile', 'profile-picture', 'follow', 'unfollow', 'logout', 'notifications'];

// Ensure the user is logged in
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next();
  req.flash("error_msg", "You must be logged in to access this page.");
  res.redirect("/login");
}

// Redirect /profile to /profile/:username if logged in
router.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    req.flash("error_msg", "You must be logged in to access this page.");
    return res.redirect("/login");
  }
  return res.redirect(`/profile/${req.user.username}`);
});

//Edit Profile GET
router.get('/edit-profile', ensureAuthenticated, (req, res) => {
  res.render('edit-profile', { title: 'Edit Profile' });
});

function isValidURL(str) {
  try {
    new URL(str);
    return true;
  } catch (_) {
    return false;
  }
}

// Edit profile POST
router.post('/edit-profile', ensureAuthenticated, upload.single('profilePicture'), async (req, res) => {
  let errors = [];
  const { name, username, bio, link, password } = req.body;

  try {
    const user = await User.findById(req.user._id);

    if (username && username !== user.username) {
      const existing = await User.findOne({ username });
      if (existing && existing._id.toString() !== user._id.toString()) {
        errors.push("Username already taken.");
      }
    }

    if (link && !isValidURL(link)) {
      errors.push("Invalid link format.");
    }

    if (password && password.length > 0) {
      if (password.length < 8) {
        errors.push("Password must be at least 8 characters.");
      }
      if (!/[A-Z]/.test(password)) {
        errors.push("Password must contain at least one uppercase letter.");
      }
      if (!/\d/.test(password)) {
        errors.push("Password must contain at least one number.");
      }
    }

    if (errors.length > 0) {
      return res.render('edit-profile', {
        error: errors.join(' ')
      });
    }

    let updated = false;

    if (name !== user.name) {
      user.name = name;
      updated = true;
    }

    if (username && username !== user.username) {
      user.username = username.toLowerCase();
      updated = true;
    }

    if (bio !== user.bio) {
      user.bio = bio;
      updated = true;
    }

    if (link !== user.link) {
      user.link = link;
      updated = true;
    }

    if (password && password.length > 0) {
      const hashed = await bcrypt.hash(password, 10);
      user.password = hashed;
      updated = true;
    }

    if (req.file && req.file.buffer) {
      user.profilePicture = req.file.buffer;
      updated = true;
    }

    if (updated) {
      await user.save();
      req.flash("success_msg", "Profile updated successfully.");
    } else {
      req.flash("info_msg", "No changes made.");
    }

    res.redirect(`/${user.username}`);
  } catch (err) {
    console.error(err);
    res.render('edit-profile', {
      title: 'Edit Profile',
      error: 'An unexpected error occurred. Please try again.'
    });
  }
});

router.get('/:username', async (req, res, next) => {
  if (reserved.includes(req.params.username)) return next();

  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) {
      req.flash("error_msg", "User not found.");
      return res.redirect("/");
    }

    const posts = await Post.find({ userId: user._id });
    const isFollowing = req.isAuthenticated() &&
      user.followers.some(followerId => followerId.equals(req.user._id));

    const userId = req.user ? req.user._id.toString() : null;

    const postsWithLikeStatus = posts.map(a => {
      const likedByUser = userId ? a.likes.map(id => id.toString()).includes(userId) : false;
      return {
        ...a.toObject(),
        likedByUser,
      };
    });

    res.render('profile', {
      title: `${user.username}'s Profile`,
      profileUser: user,
      posts: postsWithLikeStatus,
      isOwnProfile: req.isAuthenticated() && req.user.username === user.username,
      isFollowing
    });
  } catch (err) {
    console.error(err);
    req.flash("error_msg", "Something went wrong.");
    res.redirect("/");
  }
});

router.get('/profile-picture/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || !user.profilePicture) {
      return res.status(404).send('No profile picture found.');
    }

    res.set('Content-Type', 'image/jpg');
    res.send(user.profilePicture);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error retrieving profile picture.');
  }
});

// Follow a user
router.post('/follow/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || userToFollow._id.equals(currentUser._id)) {
      return res.status(400).json({ success: false });
    }

    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);

      // Delete the previous follow notification (if any)
      await Notification.findOneAndDelete({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow'
      });

      // Create a follow notification
      await Notification.create({
        recipient: userToFollow._id,
        sender: currentUser._id,
        type: 'follow'
      });
      
      await currentUser.save();
      await userToFollow.save();
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// Unfollow a user
router.post('/unfollow/:userId', ensureAuthenticated, async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.userId);
    const currentUser = await User.findById(req.user._id);

    currentUser.following = currentUser.following.filter(id => !id.equals(userToUnfollow._id));
    userToUnfollow.followers = userToUnfollow.followers.filter(id => !id.equals(currentUser._id));

    // Delete the previous follow notification
    await Notification.findOneAndDelete({
      recipient: userToUnfollow._id,
      sender: currentUser._id,
      type: 'follow'
    });

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});


router.get('/:username/followers', async (req, res, next) => {
  if (reserved.includes(req.params.username)) return next();

  const user = await User.findOne({ username: req.params.username }).populate('followers');
  if (!user) return res.redirect('/');

  res.render('followers', {
    user,
    followers: user.followers
  });
});

router.get('/:username/following', async (req, res, next) => {
  if (reserved.includes(req.params.username)) return next();

  const user = await User.findOne({ username: req.params.username }).populate('following');
  if (!user) return res.redirect('/');

  res.render('following', {
    user,
    following: user.following
  });
});

module.exports = router;

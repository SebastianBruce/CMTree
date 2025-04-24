//routes/auth.js
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const upload = multer();
const User = require('../models/User');
const Notification = require("../models/Notification");

//If a user logged in, redirect them to posts page
function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/posts');
  }
  next();
}

//Login page route
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { title: 'Login' });
});

//Handle login POST request
router.post('/login', passport.authenticate('local', {
  successRedirect: '/posts',
  failureRedirect: '/login',
  failureFlash: true
}));

//Register page route
router.get('/register', redirectIfAuthenticated, (req, res) => {
  res.render('register', { title: 'Register' });
});

//Handle register POST request
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  let errors = [];

  // Basic validation
  if (!username || !email || !password || !confirmPassword) {
    errors.push('Please fill in all fields.');
  }

  if (password !== confirmPassword) {
    errors.push('Passwords do not match.');
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters.');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number.');
  }

  if (errors.length > 0) {
    return res.render('register', {
      error: errors.join(' ')
    });
  }

  try {
    // Check if username or email is already taken
    const existingUser = await User.findOne({ $or: [{ email }, { username: username }] });
    if (existingUser) {
      return res.render('register', {
        error: 'Email or username already in use.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Load default profile picture from filesystem
    const defaultPicPath = path.join(__dirname, '../public/images/default-pfp.jpg');
    const defaultPicBuffer = fs.readFileSync(defaultPicPath);

    // Create user with default profile picture
    const newUser = new User({
      name: 'CMTree User',
      username: username.toLowerCase(),
      email,
      password: hashedPassword,
      profilePicture: defaultPicBuffer,
    });

    // Find the user to automatically follow (e.g., by username or userId)
    const userToFollow = await User.findOne({ username: 'seb' });

    if (userToFollow) {
      // Add the new user to the following list of the predefined user
      userToFollow.followers.push(newUser._id);
      await userToFollow.save();

      // Add the predefined user to the following list of the new user
      newUser.following.push(userToFollow._id);

      // Create a follow notification
      await Notification.create({
        recipient: userToFollow._id,
        sender: newUser._id,
        type: 'follow'
      });
    }

    // Save the new user
    await newUser.save();

    req.login(newUser, function(err) {
      if (err) {
        console.error(err);
        return res.render('register', {
          error: 'Registration succeeded but login failed. Please try logging in manually.'
        });
      }
      return res.redirect('/edit-profile');
    });

  } catch (err) {
    console.error(err);
    res.render('register', {
      error: err
    });
  }
});

module.exports = router;

//routes/auth.js
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcryptjs');
const router = express.Router();
const User = require('../models/User');

//If a user logged in, redirect them to assignments page
function redirectIfAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/assignments');
  }
  next();
}

//Login page route
router.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login', { title: 'Login' });
});

//Handle login POST request
router.post('/login', passport.authenticate('local', {
  successRedirect: '/assignments',
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

  //Basic validation
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
    //Check if username or email is already taken
    const existingUser = await User.findOne({ $or: [{ email }, { username: username }] });
    if (existingUser) {
      return res.render('register', {
        error: 'Email or username already in use.'
      });
    }

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    //Create and save new user
    const newUser = new User({
      name: 'CMTree User',
      username,
      email,
      password: hashedPassword
    });

    await newUser.save();

    req.flash('success_msg', 'You are now registered. Please log in.');
    res.redirect('/login');

  } catch (err) {
    console.error(err);
    res.render('register', {
      error: err
    });
  }
});

module.exports = router;

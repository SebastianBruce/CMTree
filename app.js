//Import necessary modules
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const createError = require('http-errors');
const methodOverride = require('method-override');
const hbs = require('hbs');

//Load environment variables and database connection
require('dotenv').config();
require('./config/database'); //Connect to MongoDB
require('./config/passport')(passport); //Load passport configuration

//Initialize the Express app
const app = express();

//Setup session and passport for authentication
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//Set up global variables for flash messages and user data
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error');
  res.locals.user = req.user || null; //Attach user data
  next();
});

//Format date
hbs.registerHelper('formatDate', function(date) {
  if (date !== null) {
    return new Date(date).toLocaleString('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }
});

hbs.registerHelper('timeAgo', function(date) {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now - then) / 1000); // seconds difference

  if (diff < 60) return 'now'; // Less than a minute ago
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; // Less than an hour ago
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; // Less than a day ago
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`; // Less than a week ago

  // For older than a week, return a formatted date
  return then.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC', // User time-zone
  });  
});

// In your app.js or wherever you set up Handlebars
hbs.registerHelper('ifEquals', function (arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

//Configure the view engine and views folder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

//Middleware for logging, parsing requests, cookies, and serving static files
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(methodOverride('_method'));

//Import and set up routes
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const notificationRoutes = require("./routes/notifications");
app.use('/', usersRouter);
app.use('/', authRouter);
app.use("/", notificationRoutes);

//Define routes for rendering pages
app.get('/', (req, res) => res.render('index'));
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/'); //Redirect to home after logout
  });
});
app.get('/register', (req, res) => res.render('register'));

const postsRouter = require('./routes/posts');
app.use('/', postsRouter);

//Error handling middleware
app.use(function(req, res, next) {
  next(createError(404)); //Handle 404 errors
});
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {}; //Show full error in development
  res.status(err.status || 500);
  res.render('error'); //Render the error page
});

module.exports = app;

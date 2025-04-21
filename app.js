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
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });
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
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/', authRouter);

//Define routes for rendering pages
app.get('/', (req, res) => res.render('index'));
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/'); //Redirect to home after logout
  });
});
app.get('/register', (req, res) => res.render('register'));

const assignmentsRouter = require('./routes/assignments');
app.use('/', assignmentsRouter);

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

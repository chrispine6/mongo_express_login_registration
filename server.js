const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const User = require('./models/User');
const mongoose = require('mongoose');

// Initialize the express app
const app = express();

app.use(session({
    secret: 'your secret here',
    resave: false,
    saveUninitialized: false
}));

mongoose.connect('mongodb://localhost:27017/myapp', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});


app.use(passport.initialize());
app.use(passport.session());

// Passport initialization
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// static file serving setup
app.use(express.static(path.join(__dirname, 'public')));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// moddleware to parse the request body
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// finally the routes
app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('index');
});

app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/profile', isAuthenticated, (req, res) => {
    res.render('profile', { user: req.user });
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/profile',
    failureRedirect: '/login'
}));

app.post('/register', (req, res) => {
   console.log(req.body); 
   if (!req.body.username || !req.body.password) {
       return res.status(400).send('Username and password are required');
   }

   const newUser = new User({ username: req.body.username });
   
   // set password using setPassword method provided by passport-local-mongoose
   newUser.setPassword(req.body.password, (err) => {
       if (err) {
           console.error(err);
           return res.status(500).send('Error setting password');
       }

       // finally save user to db
       newUser.save()
           .then((savedUser) => {
               // registration success
               res.redirect('/login'); // redirect user back to login page
           })
           .catch((saveErr) => {
               console.error(saveErr);
               return res.status(500).send('Error saving user');
           });
   });
});



app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

// listener function
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

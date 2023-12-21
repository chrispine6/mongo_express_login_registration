const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const path = require('path');
const User = require('./models/User');
const Community = require('./models/Community');
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


passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/login', (req, res) => {
    res.render('login');
});

app.get('/register', (req, res) => {
    res.render('register');
});


app.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('communities');

        if (!user) {
            return res.status(404).send('User not found');
        }

        res.render('profile', { user });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching user profile');
    }
});

app.get('/create-community', isAuthenticated, (req, res) => {
    res.render('create-community');
});

app.post('/create-community', isAuthenticated, async (req, res) => {
    const { name, description } = req.body;

    try {
        const newCommunity = await Community.create({ name, description });
        res.redirect(`/community/${newCommunity._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error creating community');
    }
});

app.get('/community/:id', isAuthenticated, async (req, res) => {
    const communityId = req.params.id;

    try {
        const community = await Community.findById(communityId).populate('members');

        if (!community) {
            return res.status(404).send('Community not found');
        }

        res.render('community-view', { community });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error fetching community');
    }
});

app.post('/community/add-user/:id', isAuthenticated, async (req, res) => {
    const communityId = req.params.id;
    const userId = req.body.userId;

    try {
        const community = await Community.findById(communityId);

        if (!community) {
            return res.status(404).send('Community not found');
        }

        if (community.members.includes(userId)) {
            return res.status(400).send('User is already a member of this community');
        }

        community.members.push(userId);
        await community.save();

        res.redirect(`/community/${community._id}`);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error adding user to community');
    }
});

app.post('/login', passport.authenticate('local', {
    successRedirect: '/posts',
    failureRedirect: '/login'
}));

app.get('/profile', isAuthenticated, async (req, res) => {
    // Your existing profile route logic
    res.render('profile', { user });
});

app.get('/posts', isAuthenticated, (req, res) => {
    res.render('pages/posts', { user: req.user });
});

app.get('/messages', isAuthenticated, (req, res) => {
    res.render('pages/messages', { user: req.user });
});

app.get('/calendar', isAuthenticated, (req, res) => {
    res.render('pages/calendar', { user: req.user });
});

app.post('/register', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }

    User.register(new User({ username }), password, (err, user) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Error registering user');
        }

        passport.authenticate('local')(req, res, () => {
            res.redirect('/login');
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
    res.status(401).send('Unauthorized access. Please log in.');
}

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});

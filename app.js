// Other imports
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}


const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const ExpressError = require('./util/error');
const methodOverride = require('method-override');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
// Import routers
const MongoDBStore = require("connect-mongo")(session);
const userRoutes = require('./router/users');
const campgroundRoutes = require('./router/campgrounds');
const reviewRoutes = require('./router/review');
const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp';
// Middleware and configurations
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect(dbUrl);
    console.log("Connected to MongoDB");
}

// Set up view engine
app.engine('ejs', ejsMate);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session and Flash configuration
const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

const store = new MongoDBStore({
    url: dbUrl,
    secret,
    touchAfter: 24 * 60 * 60
});

store.on("error", function (e) {
    console.log("SESSION STORE ERROR", e)
})

const sessionConfig = {
    store,
    name: 'session',
    secret,
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        // secure: true,
        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}
app.use(session(sessionConfig));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Corrected Middleware for Setting ReturnTo Session
app.use((req, res, next) => {
    // Define the protected routes that require authentication
    const protectedRoutes = [
        '/campgrounds',
        '/campgrounds/',
        '/campgrounds/:id',
        '/campgrounds/:id/reviews'
        // Add other protected routes as needed
    ];

    // Check if the requested URL matches any protected route
    const isProtectedRoute = protectedRoutes.some(route =>
        req.originalUrl.startsWith(route) || req.path.startsWith(route)
    );

    // If the user is not authenticated and is trying to access a protected route
    if (!req.isAuthenticated() && isProtectedRoute) {
        // console.log(`Redirecting from: ${req.originalUrl}`);
        req.session.returnTo = req.originalUrl; // Set returnTo for the protected route
    }

    // Set local variables for the views
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.use('/', userRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/reviews', reviewRoutes);

app.get('/', (req, res) => {
    res.render('home');
});

// 404 Handler
app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found', 404));
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) err.message = 'Oh No, Something Went Wrong!';
    res.status(statusCode).render('error', { err });
});

const PORT = process.env.PORT || 3000;  // Change 3000 to any available port

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

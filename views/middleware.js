const Campground = require('../models/campground');
const Review = require('../models/review');
const ExpressError = require('../util/error');
const { campgroundSchema, reviewSchema } = require('../schema');
const mongoose = require('mongoose');
// Validate campground input
// module.exports.validateCampground = (req, res, next) => {
//     const { error } = campgroundSchema.validate(req.body);
//     if (error) {
//         const msg = error.details.map(el => el.message).join(',');
//         throw new ExpressError(msg, 400);
//     }
//     next();
// };
module.exports.validateCampground = (req, res, next) => {
    const { error } = campgroundSchema.validate(req.body);
    console.log(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        throw new ExpressError(msg, 400)
    } else {
        next();
    }
}

// Check if user is logged in
// module.exports.isLoggedIn = (req, res, next) => {
//     if (!req.isAuthenticated()) {
//         req.session.returnTo = req.originalUrl;
//         req.flash('error', 'You must be signed in first!');
//         return res.redirect('/login');
//     }
//     next();
// };
module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl; // add this line
        console.log(req.session.returnTo);
        req.flash('error', 'You must be signed in first!');
        return res.redirect('/login');
    }
    next();
}
// Store returnTo in response locals
module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

// Check if user is the author of the campground
module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const campground = await Campground.findById(id);

    // Ensure req.user is defined and is the author
    if (!campground.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};

// Check if user is the author of the review
module.exports.isReviewAuthor = async (req, res, next) => {
    const { id, reviewId } = req.params;
    const review = await Review.findById(reviewId);

    // Ensure req.user is defined and is the review author
    if (!review.author || !req.user || !review.author.equals(req.user._id)) {
        req.flash('error', 'You do not have permission to do that!');
        return res.redirect(`/campgrounds/${id}`);
    }
    next();
};

// Validate review input
module.exports.validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
};

module.exports.isValidObjectId = (req, res, next) => {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
        req.flash('error', 'Invalid Campground ID');
        return res.redirect('/campgrounds'); // Redirect to an appropriate route
    }
    next();
};

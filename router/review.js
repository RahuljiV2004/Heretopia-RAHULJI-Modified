// const express = require('express');
// const router = express.Router({ mergeParams: true });
// const Campground = require('../models/campground');
// const Review = require('../models/review'); // Ensure this import is present
// const { reviewSchema } = require('../schema.js');
// const ExpressError = require('../util/error');
// const catchAsync = require('../util/catch');

// const { isLoggedIn, isReviewAuthor, validateCampground } = require('../views/middleware');
// // Validation middleware
// const validateReview = (req, res, next) => {
//     const { error } = reviewSchema.validate(req.body);
//     if (error) {
//         const msg = error.details.map(el => el.message).join(',');
//         throw new ExpressError(msg, 400);
//     }
//     next();
// };

// // Create a review

// router.post('/', isLoggedIn, validateReview, catchAsync(async (req, res) => {
//     const campground = await Campground.findById(req.params.id);
//     const review = new Review(req.body.review);
//     review.author = req.user._id;
//     campground.reviews.push(review);
//     await review.save();
//     await campground.save();
//     req.flash('success', 'Created new review!');
//     res.redirect(`/campgrounds/${campground._id}`);
// }))

// // Delete a review

// router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => {
//     const { id, reviewId } = req.params;
//     await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
//     await Review.findByIdAndDelete(reviewId);
//     req.flash('success', 'Successfully deleted review')
//     res.redirect(`/campgrounds/${id}`);
// }))

// module.exports = router;
const express = require('express');
const router = express.Router({ mergeParams: true });
const Campground = require('../models/campground');
const Review = require('../models/review'); // Ensure this import is present
const { reviewSchema } = require('../schema.js');
const ExpressError = require('../util/error');
const catchAsync = require('../util/catch');

const { isLoggedIn, isReviewAuthor, validateCampground } = require('../views/middleware');

// Nodemailer configuration
const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // You can use your email service (Gmail, SendGrid, etc.)
    auth: {
        user: 'rahuljiv2004@gmail.com', // Your email
        pass: 'sdjv yxmp vxcv dkfu'     // Your email password
    }
});

// Email sending function
const sendReviewNotification = (fromEmail, toEmail, campgroundName, reviewContent, reviewUser) => {
    const mailOptions = {
        from: fromEmail,
        to: toEmail, // Email of the user who added the campground
        subject: 'New comment on Your post',
        text: `A new comment has been posted for "${campgroundName}": "${reviewContent}" by ${reviewUser} `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
};

// Validation middleware
const validateReview = (req, res, next) => {
    const { error } = reviewSchema.validate(req.body);
    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    next();
};

// Create a review
router.post('/', isLoggedIn, validateReview, catchAsync(async (req, res) => {
    const campground = await Campground.findById(req.params.id).populate('author');
    const review = new Review(req.body.review);
    review.author = req.user._id; // Store the logged-in user's ID
    campground.reviews.push(review);

    await review.save();
    await campground.save();

    // Send email notification
    const fromEmail = req.user.email; // Get the logged-in user's email
    const toEmail = campground.author.email; // Assuming you have the campground author's email stored
    const reviewUser = req.user.username;
    sendReviewNotification(fromEmail, toEmail, campground.title, review.body, reviewUser); // Use the actual review content

    req.flash('success', 'Created new review!');
    res.redirect(`/campgrounds/${campground._id}`);
}));

// Delete a review
router.delete('/:reviewId', isLoggedIn, isReviewAuthor, catchAsync(async (req, res) => {
    const { id, reviewId } = req.params;
    await Campground.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await Review.findByIdAndDelete(reviewId);
    req.flash('success', 'Successfully deleted review');
    res.redirect(`/campgrounds/${id}`);
}));

module.exports = router;


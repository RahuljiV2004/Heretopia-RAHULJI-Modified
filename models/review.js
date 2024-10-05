const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    body: String,
    rating: Number,
    campground: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Campground'
    },
    author: { // Add this field
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // Adjust 'User' to the actual name of your user model
    }
});

module.exports = mongoose.model('Review', reviewSchema);

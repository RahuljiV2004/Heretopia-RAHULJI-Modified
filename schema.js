const Joi = require('joi');

module.exports.campgroundSchema = Joi.object({
    campground: Joi.object({
        title: Joi.string().required(),
        price: Joi.number().required().min(0),
        location: Joi.string().required(),
        description: Joi.string().required(),
        images: Joi.array().items(Joi.object({
            url: Joi.string().uri().required(), // Ensure the URL is valid
            filename: Joi.string().required()    // Ensure the filename is present
        })).optional() // Optional, change to required() if you want to enforce it
    }).required(),
    deleteImages: Joi.array()
});

module.exports.reviewSchema = Joi.object({
    review: Joi.object({
        rating: Joi.number().required().min(1).max(5),
        body: Joi.string().required()
    }).required()
});

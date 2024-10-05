

const express = require('express');
const router = express.Router({ mergeParams: true });
const catchAsync = require('../util/catch');
const { campgroundSchema } = require('../schema.js');
const ExpressError = require('../util/error');
const Campground = require('../models/campground');
const { isLoggedIn, isAuthor, validateCampground, isValidObjectId } = require('../views/middleware');
// const Review = require('./review');
const multer = require('multer');
const { cloudinary } = require("../cloudinary");
const { storage } = require('../cloudinary');
const upload = multer({ storage });
const Review = require('../models/review'); // Ensure this path is correct
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });

// Validation middleware


// Get all campgrounds
router.get('/', catchAsync(async (req, res) => {
    const campgrounds = await Campground.find({});
    res.render('campground/index', { campgrounds });
}));

router.get('/new', isLoggedIn, (req, res) => {
    res.render('campground/new');
})

// router.post('/', isLoggedIn, upload.array('image'), validateCampground, catchAsync(async (req, res, next) => {
//     console.log(req.body, req.files);
//     const campground = new Campground(req.body.campground);
//     campground.author = req.user._id;
//     await campground.save();
//     req.flash('success', 'Successfully made a new campground!');
//     res.redirect(`/campgrounds/${campground._id}`)
// }))
// Your POST route handling the creation of campgrounds
router.post(
    '/',
    // Multer handles the image upload first
    isLoggedIn,
    upload.array('images'),           // Then check if the user is logged in
    validateCampground,        // Then validate the rest of the data (without image validation in Joi)
    catchAsync(async (req, res, next) => {
        // Create a new Campground instance
        const geoData = await geocoder.forwardGeocode({
            query: req.body.campground.location,
            limit: 1
        }).send()


        const campground = new Campground(req.body.campground);
        campground.geometry = geoData.body.features[0].geometry;
        // Map the uploaded image files (from multer's req.files) to add to the images array
        if (req.files) {
            campground.images = req.files.map(f => ({ url: f.path, filename: f.filename }));
        }

        // Set the author of the campground as the logged-in user
        campground.author = req.user._id;

        // Save the new campground to the database
        await campground.save();

        // console.log(campground)

        // Flash success message and redirect the user to the new campground page
        req.flash('success', 'Successfully made a new campground!');
        res.redirect(`/campgrounds/${campground._id}`);
    })
);

// router.post('/', upload.array('image', 10), (req, res) => { // 10 is the max number of files
//     // Make sure to check if files exist
//     if (!req.files || req.files.length === 0) {
//         return res.status(400).send('No files uploaded.');
//     }

//     const campgroundData = {
//         ...req.body.campground,
//         images: req.files.map(file => ({
//             url: file.path,
//             filename: file.filename
//         }))
//     };

//     res.status(200).send({
//         body: campgroundData,
//         files: req.files
//     });
// });




// Show specific campground
// Show specific campground
router.get('/:id', isValidObjectId, catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id).populate({
        path: 'reviews',
        populate: {
            path: 'author'
        }
    }).populate('author');

    // console.log(camp);

    if (!camp) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }

    res.render('campground/show', { camp });
}));





// Edit campground form

router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const camp = await Campground.findById(req.params.id)
    if (!camp) {
        req.flash('error', 'Cannot find that campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campground/edit', { camp });
}))


// Update campground
// router.put('/:id', validateCampground, catchAsync(async (req, res) => {
//     const { id } = req.params;
//     console.log(req.body);
//     const camp = await Campground.findByIdAndUpdate(id, { ...req.body.camp });
//     const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
//     camp.images.push(...imgs);
//     await camp.save();

//     req.flash('success', 'Successfully updated campground!');
//     res.redirect(`/campgrounds/${camp._id}`);
// }));
// router.put('/:id', isLoggedIn, isAuthor, upload.array('images'), validateCampground, catchAsync(async (req, res) => {
//     const { id } = req.params;
//     const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
//     console.log(req.body);
//     // Add new images
//     const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
//     camp.images.push(...imgs);

//     // Check if images are selected for deletion
//     if (req.body.deleteImages) {
//         // Filter out the images that are not selected for deletion
//         camp.images = camp.images.filter(img => !req.body.deleteImages.includes(img.filename));

//         // Optionally: You can add cloudinary deletion logic here
//         for (let filename of req.body.deleteImages) {
//             // Uncomment if using cloudinary
//             await cloudinary.uploader.destroy(filename);
//         }
//     }

//     // Save the updated campground
//     await camp.save();

//     req.flash('success', 'Successfully updated campground!');
//     res.redirect(`/campgrounds/${camp._id}`);
// }));


// router.put('/:id', isLoggedIn, isAuthor, upload.array('images'), validateCampground, catchAsync(async (req, res) => {
//     const { id } = req.params;


//     console.log(req.body);
//     const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });
//     const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
//     camp.images.push(...imgs);
//     await camp.save();
//     if (req.body.deleteImages) {
//         for (let filename of req.body.deleteImages) {
//             await cloudinary.uploader.destroy(filename);
//         }
//         await camp.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } })
//     }
//     req.flash('success', 'Successfully updated campground!');
//     res.redirect(`/campgrounds/${camp._id}`)
// }));
// router.route('/:id')
//     .put(isLoggedIn, isAuthor, upload.array('images'), validateCampground, catchAsync(async (req, res) => {
//         const { id } = req.params;
//         console.log("Hiiiiii: ", req.body.deleteImages)
//         // Update the campground with the new data
//         const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });

//         // Handle new image uploads
//         const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
//         camp.images.push(...imgs);
//         await camp.save();

//         // Handle image deletion
//         if (req.body.deleteImages && req.body.deleteImages.length) {
//             for (let filename of req.body.deleteImages) {
//                 // Delete images from cloudinary
//                 await cloudinary.uploader.destroy(filename);
//             }

//             // Remove image references from the campground
//             await camp.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
//         }

//         // Flash success message and redirect
//         req.flash('success', 'Successfully updated campground!');
//         res.redirect(`/campgrounds/${camp._id}`);
//     }));
router.route('/:id')
    .put(isLoggedIn, isAuthor, upload.array('images'), validateCampground, catchAsync(async (req, res) => {
        const { id } = req.params;
        console.log("Hiiiiii: ", req.body.deleteImages)
        // Update the campground with the new data
        const camp = await Campground.findByIdAndUpdate(id, { ...req.body.campground });

        // Handle new image uploads
        const imgs = req.files.map(f => ({ url: f.path, filename: f.filename }));
        camp.images.push(...imgs);
        await camp.save();

        // Ensure deleteImages is an array
        req.body.deleteImages = req.body.deleteImages || [];

        // Handle image deletion
        if (req.body.deleteImages.length) {
            for (let filename of req.body.deleteImages) {
                // Delete images from cloudinary
                await cloudinary.uploader.destroy(filename);
            }

            // Remove image references from the campground
            await camp.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
        }

        // Flash success message and redirect
        req.flash('success', 'Successfully updated campground!');
        res.redirect(`/campgrounds/${camp._id}`);
    }));

// Delete campground
// router.delete('/:id', catchAsync(async (req, res) => {
//     const { id } = req.params;
//     await Campground.findByIdAndDelete(id);
//     req.flash('success', 'Successfully deleted campground')
//     res.redirect('/campgrounds');
// }));
router.delete('/:id', isLoggedIn, isAuthor, catchAsync(async (req, res) => {
    const { id } = req.params;
    await Campground.findByIdAndDelete(id);
    req.flash('success', 'Successfully deleted campground')
    res.redirect('/campgrounds');
}));




module.exports = router;

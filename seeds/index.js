const mongoose = require('mongoose');
const cities = require('./indcitites.js')
const path = require('path');
const { places, descriptors } = require('./seedHelpers.js')

const Campground = require('../models/campground.js');
main().catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/yelp-camp');
    console.log("Connected")
    // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

const sample = array => array[Math.floor(Math.random() * array.length)];

const seedDB = async () => {
    await Campground.deleteMany({});
    // const c = new campground({ title: 'purple field' });
    for (let i = 0; i < 50; i++) {
        const random1 = Math.floor(Math.random() * cities.length);
        const random12 = Math.floor(Math.random() * 30) + 20;
        const camp = new Campground(
            {
                author: '66feb92282e428e2c8ac1a92',
                location: `${cities[random1].city},${cities[random1].admin_name}`,
                title: `${sample(descriptors)} ${sample(places)}`,
                image: `https://picsum.photos/400?random=${Math.random()}`,
                description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Officiis harum magnam iste asperiores adipisci ratione sunt, nemo quisquam accusantium ut dolore commodi veritatis quae consequatur quidem consequuntur repellat vitae quam!',
                price: random12,
                geometry: {
                    type: "Point",
                    coordinates: [
                        
                    ]
                }

            }
        )

        await camp.save();
    }
}

seedDB();
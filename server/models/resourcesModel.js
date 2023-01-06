const mongoose = require('mongoose');

const ResourcesSchema = mongoose.Schema({
    imageKey: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    published: {
        type: Boolean,
        required: true,
        default: false
    },
    star: {
        type: Number,
    },
    seller: { 
        type: mongoose.Schema.Types.ObjectID, 
        ref: 'User' 
    },
    category: {
        type: String,
        //required: true
    },
    tags: {
        type: String,
        //required: true
    },
});

module.exports = mongoose.model('Resources', ResourcesSchema);
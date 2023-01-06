const mongoose = require("mongoose");

const CourseMajorSchema = new mongoose.Schema(
    {
        entered: {
            type: Boolean,
            unique: false,
            //required: [true, "Please provide a username"],
        },
        time: {
            type: String,
            unique: false,
            //required: [true, "Please provide a username"],
        },
    }
);

const CourseMajor = mongoose.model("CourseMajor", CourseMajorSchema);

module.exports = CourseMajor;
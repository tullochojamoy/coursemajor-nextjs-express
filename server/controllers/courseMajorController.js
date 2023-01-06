const CourseMajor = require('../models/courseMajorModel');

//Create a course
exports.enter = async (req, res) => {
    const coursemajor = new CourseMajor({
        entered: true,
        time:Math.random(),
    });
    //Save to DB and respond with data (Testing) or errr
    try{
        const savedCourse = await coursemajor.save();
        res.json(savedCourse);
        console.log(savedCourse);
    } catch (err) {
        res.json({ message: err });
        console.log(err);
    }
};